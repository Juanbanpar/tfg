python access.py --cascade haarcascade_frontalface_default.xml --encodings encodings.pickle&
export FLASK_ENV=production
export FLASK_APP=rest.py
flask run --cert=cert.pem --key=key.pem --host=0.0.0.0 
