import psycopg2
import json

from flask import Flask, request, json, jsonify, abort
from flask_jwt_extended import create_access_token, get_jwt, get_jwt_identity, jwt_required, JWTManager, set_access_cookies, unset_jwt_cookies, get_csrf_token

from datetime import datetime, timedelta, timezone

#Configuración de la API REST
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

#Método de autenticación en el sistema
#Uso:
#En el cuerpo de la petición
#{
#   "iduser": "id"   
#   "password": "passwd"
#}
#Como respuesta en caso de autentición correcta se recibe una cookie con el token de acceso
#el frontend no requiere de ninguna lógica para manejar la caducidad del mismo pues después
#de cada petición se comprueba su caducidad y se renueva
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
def unauthorized(e):
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

#Petición para obtener todos los datos del control ambiental
@app.route('/data', methods=['GET'])
@jwt_required()
def show_all_data():
    if request.method == 'GET':
        with open('./data.json') as f:
            data = json.load(f)
            
            response = app.response_class(
                response=json.dumps(data),
                status=200,
                mimetype='application/json'
            )
            return response

#Petición para obtener un solo valor del control ambiental        
@app.route('/data/<value>', methods=['GET'])
@jwt_required()
def show_selected_data(value):
    if request.method == 'GET':
        with open('./data.json') as f:
            data = json.load(f)
            selectedData = value + ": " + str(data[value])
            
            response = app.response_class(
                response=json.dumps(selectedData),
                status=200,
                mimetype='application/json'
            )
            return response

