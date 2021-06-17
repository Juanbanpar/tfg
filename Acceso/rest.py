import psycopg2

from flask import Flask, request, json, jsonify, abort
from flask_jwt_extended import create_access_token, get_jwt, get_jwt_identity, jwt_required, JWTManager, set_access_cookies, unset_jwt_cookies, get_csrf_token, decode_token

from datetime import datetime, timedelta, timezone

def query_all(query, one=False):
    con = psycopg2.connect(dbname='acceso', user='postgres', password='basededatos', host='192.168.0.11', port='5432', sslmode='require')
    
    cur = con.cursor()
    cur.execute(query)
    r = [dict((cur.description[i][0], value) \
               for i, value in enumerate(row)) for row in cur.fetchall()]
    
    con.close()
    return (r[0] if r else None) if one else r

app = Flask(__name__)
app.debug = False
app.config["JWT_COOKIE_SECURE"] = True
app.config["JWT_TOKEN_LOCATION"] = ["cookies"]
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)
app.config["JWT_SECRET_KEY"] = "segredo"
app.config["JWT_CSRF_IN_COOKIES"] = False

if __name__ == "__main__":
    app.run(host='0.0.0.0')
    app.run(ssl_context=('cert.pem', 'key.pem'))

jwt = JWTManager(app)

@app.after_request
def refresh_expiring_jwts(response):
    try:
        exp_timestamp = get_jwt()["exp"]
        now = datetime.now(timezone.utc)
        target_timestamp = datetime.timestamp(now + timedelta(minutes=30))
        if target_timestamp > exp_timestamp:
            access_token = create_access_token(identity=get_jwt_identity())
            set_access_cookies(response, access_token)
        return response
    except (RuntimeError, KeyError):
        return response


@app.route("/login", methods=["POST"])
def login():
    iduser = request.json.get("iduser", None)
    password = request.json.get("password", None)
    
    try:
        iduser = int(iduser)

        con = psycopg2.connect(dbname='acceso', user='postgres', password='basededatos', host='192.168.0.11', port='5432', sslmode='require')
        
        cur = con.cursor()
        cur.execute("SELECT * FROM users WHERE idUser=%s AND password=crypt(%s, password) AND current_privilege='admin'", (iduser,password,))
        usuario = cur.fetchone()
        
        con.close()
        
        if usuario is None:
            abort(401, description="Invalid iduser or password")
        
        #response = jsonify({"msg": "login successful"})
        access_token = create_access_token(identity=iduser)
        csrf = get_csrf_token(access_token);
        response = jsonify(msg="login successful", csrf=csrf, access_token=access_token)
        set_access_cookies(response, access_token)
        return response
    
    except ValueError:
        abort(406, description="Userid is not an integer")



@app.errorhandler(404)
def resource_not_found(e):
    return jsonify(error=str(e)), 404

@app.errorhandler(401)
def resource_not_found(e):
    return jsonify(error=str(e)), 401

@app.errorhandler(406)
def resource_not_found(e):
    return jsonify(error=str(e)), 406

@app.route('/')
def index():
    return 'Index Page'

@app.route('/protected', methods=["GET"])
@jwt_required()
def protected():
    return '%s' % current_identity

@app.route('/user', methods=['GET', 'POST', 'DELETE'])
@jwt_required()
def show_users():
    if request.method == 'GET':
        query = query_all("SELECT * FROM users")
        json_output = json.dumps(query)
        
        if (json_output is None): abort(404, description="No users found")
        
        response = app.response_class(
            response=json.dumps(query),
            status=200,
            mimetype='application/json'
        )
        return response

    if request.method == 'POST':
        name = request.json.get("name", None)
        lastname1 = request.json.get("lastname1", None)
        lastname2 = request.json.get("lastname2", None)
        current_privilege = request.json.get("current_privilege", None)
        idcard = request.json.get("idcard", None)
        password = request.json.get("password", None)
        
        con = psycopg2.connect(dbname='acceso', user='postgres', password='basededatos', host='192.168.0.11', port='5432', sslmode='require')
        
        cur = con.cursor()
        cur.execute("INSERT INTO users(name, lastname1, lastname2, current_privilege, idcard, password) VALUES (%s, %s, %s, %s, %s, crypt(%s, gen_salt('bf')))", (name, lastname1, lastname2, current_privilege, idcard, password))
        con.commit()
        
        cur.execute("SELECT * FROM users WHERE idCard=%s", (idcard,))
        usuario = cur.fetchone()
        
        con.close()
        
        return jsonify(
            name = usuario[0],
            lastname1 = usuario[1],
            lastname2 = usuario[2],
            current_privilege = usuario[3],
            idcard = usuario[4],
            iduser = usuario[5],
            password = usuario[6],
        )
    
    if request.method == 'DELETE':
        query = query_all("SELECT * FROM users")
        json_output = json.dumps(query)
        
        if (json_output is None): abort(404, description="No users found")
        
        con = psycopg2.connect(dbname='acceso', user='postgres', password='basededatos', host='192.168.0.11', port='5432', sslmode='require')
        cur = con.cursor()
        cur.execute("TRUNCATE TABLE users CASCADE")
        con.commit()
        
        response = app.response_class(
            response=json.dumps(query),
            status=200,
            mimetype='application/json'
        )
        return response

@app.route('/user/<userIdentification>', methods=['GET', 'PUT', 'DELETE'])
@jwt_required()
def show_user(userIdentification):
    if request.method == 'GET':
        con = psycopg2.connect(dbname='acceso', user='postgres', password='basededatos', host='192.168.0.11', port='5432', sslmode='require')
        
        cur = con.cursor()
        cur.execute("SELECT * FROM users WHERE idUser=%s", (userIdentification,))
        usuario = cur.fetchone()
        
        con.close()
        
        if (usuario is None): abort(404, description="User not found")
                
        return jsonify(
            name = usuario[0],
            lastname1 = usuario[1],
            lastname2 = usuario[2],
            current_privilege = usuario[3],
            idcard = usuario[4],
            iduser = usuario[5],
            password = usuario[6]
        )
    
    if request.method == 'PUT':
        con = psycopg2.connect(dbname='acceso', user='postgres', password='basededatos', host='192.168.0.11', port='5432', sslmode='require')
        
        cur = con.cursor()
        cur.execute("SELECT * FROM users WHERE idUser=%s", (userIdentification,))
        usuario = cur.fetchone()
        
        if (usuario is None):
            con.close()
            abort(404, description="User not found")
        
        name = request.json.get("name", None)
        lastname1 = request.json.get("lastname1", None)
        lastname2 = request.json.get("lastname2", None)
        current_privilege = request.json.get("current_privilege", None)
        idcard = request.json.get("idcard", None)
        password = request.json.get("password", None)
        
        cur.execute("UPDATE users SET name=%s, lastname1=%s, lastname2=%s, current_privilege=%s, idcard=%s, password=crypt(%s, gen_salt('bf')) WHERE idUser=%s", (name, lastname1, lastname2, current_privilege, idcard, password, userIdentification))
        con.commit();
        
        cur.execute("SELECT * FROM users WHERE idUser=%s", (userIdentification,))
        usuarioE = cur.fetchone()
        
        con.close()
                
        return jsonify(
            name = name,
            lastname1 = usuarioE[1],
            lastname2 = usuarioE[2],
            current_privilege = usuarioE[3],
            idcard = usuarioE[4],
            iduser = usuarioE[5],
            password = usuarioE[6]
        )
    
    if request.method == 'DELETE':
        con = psycopg2.connect(dbname='acceso', user='postgres', password='basededatos', host='192.168.0.11', port='5432', sslmode='require')
        
        cur = con.cursor()
        cur.execute("SELECT * FROM users WHERE idUser=%s", (userIdentification,))
        usuario = cur.fetchone()
        
        if (usuario is None):
            con.close()
            abort(404, description="User not found")
        
        cur.execute("DELETE FROM users WHERE idUser=%s", (userIdentification,))
        con.commit()
        
        con.close()
        
        return jsonify(
            name = usuario[0],
            lastname1 = usuario[1],
            lastname2 = usuario[2],
            current_privilege = usuario[3],
            idcard = usuario[4],
            iduser = usuario[5],
            password = usuario[6]
        )

@app.route('/log', methods=['GET', 'POST', 'DELETE'])
@jwt_required()
def show_logs():
    if request.method == 'GET':
        query = query_all("SELECT * FROM logs")
        json_output = json.dumps(query)
        
        if (json_output is None): abort(404, description="No logs found")
        
        response = app.response_class(
            response=json.dumps(query),
            status=200,
            mimetype='application/json'
        )
        return response

    if request.method == 'POST':
        iduser = request.json.get("iduser", None)
        
        con = psycopg2.connect(dbname='acceso', user='postgres', password='basededatos', host='192.168.0.11', port='5432', sslmode='require')
        
        cur = con.cursor()
        cur.execute("INSERT INTO logs(accesstime, user_fk) VALUES (now(), %s)", (iduser,))
        con.commit()
                
        cur.execute("SELECT * FROM logs WHERE user_fk=%s ORDER BY accesstime DESC;", (iduser,))
        log = cur.fetchone()
        
        con.close()
        
        return jsonify(
            idaccess = log[0],
            accesstime = log[1],
            user_fk = log[2],
        )
    
    if request.method == 'DELETE':
        query = query_all("SELECT * FROM logs")
        json_output = json.dumps(query)
        
        if (json_output is None): abort(404, description="No logs found")
        
        con = psycopg2.connect(dbname='acceso', user='postgres', password='basededatos', host='192.168.0.11', port='5432', sslmode='require')
        cur = con.cursor()
        cur.execute("TRUNCATE TABLE logs")
        con.commit()
        con.close()
        
        response = app.response_class(
            response=json.dumps(query),
            status=200,
            mimetype='application/json'
        )
        return response


@app.route('/log/<logIdentification>', methods=['GET', 'PUT', 'DELETE'])
@jwt_required()
def show_log(logIdentification):
    if request.method == 'GET':
        con = psycopg2.connect(dbname='acceso', user='postgres', password='basededatos', host='192.168.0.11', port='5432', sslmode='require')
        
        cur = con.cursor()
        cur.execute("SELECT * FROM logs WHERE idAccess=%s", (logIdentification,))
        log = cur.fetchone()
        
        con.close()
        
        if (log is None): abort(404, description="Log not found")
        
        return jsonify(
            idaccess = log[0],
            accesstime = log[1],
            user_fk = log[2],
        )
    
    if request.method == 'PUT':
        con = psycopg2.connect(dbname='acceso', user='postgres', password='basededatos', host='192.168.0.11', port='5432', sslmode='require')
        
        cur = con.cursor()
        cur.execute("SELECT * FROM logs WHERE idAccess=%s", (logIdentification,))
        log = cur.fetchone()
        
        if (log is None): 
            con.close()
            abort(404, description="Log not found")
        
        iduser = request.json.get("iduser", None)
        cur.execute("UPDATE logs SET user_fk=%s WHERE idAccess=%s", (iduser, logIdentification,))
        con.commit();
        
        cur.execute("SELECT * FROM logs WHERE idAccess=%s", (logIdentification,))
        logE = cur.fetchone()
        
        con.close()
                
        return jsonify(
            idaccess = logE[0],
            accesstime = logE[1],
            user_fk = logE[2],
        )
    
    if request.method == 'DELETE':
        con = psycopg2.connect(dbname='acceso', user='postgres', password='basededatos', host='192.168.0.11', port='5432', sslmode='require')
        
        cur = con.cursor()
        cur.execute("SELECT * FROM logs WHERE idAccess=%s", (logIdentification,))
        log = cur.fetchone()
        
        if (log is None): 
            con.close()
            abort(404, description="Log not found")
        
        cur.execute("DELETE FROM logs WHERE idAccess=%s", (logIdentification,))
        con.commit()
        
        con.close()
        
        return jsonify(
            idaccess = log[0],
            accesstime = log[1],
            user_fk = log[2],
        )
    
@app.route('/encodings', methods=['POST'])
@jwt_required()
def upload_file():
    if request.method == 'POST':
        static_file = request.files['the_file']
        # here you can send this static_file to a storage service
        # or save it permanently to the file system
        static_file.save('./encodings.pickle')
        
        return jsonify(
            msg = "Face encodings uploaded"
        )
    
