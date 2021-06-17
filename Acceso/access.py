#!/usr/bin/env python

#python access.py --cascade haarcascade_frontalface_default.xml --encodings encodings.pickle

import time, sys
import RPi.GPIO as GPIO
from mfrc522 import SimpleMFRC522

import psycopg2

import argparse
import pickle
from imutils.video import VideoStream
from imutils.video import FPS
import face_recognition
import imutils
import cv2

#Parser de argumentos
parser = argparse.ArgumentParser()
parser.add_argument("-c", "--cascade", required=True, help = "Path al haarcascade")
parser.add_argument("-e", "--encodings", required=True, help="Path al fichero de la codificación de las caras")
args = vars(parser.parse_args())

#Comenzamos el stream de video a través de la cámara
vs = VideoStream(src=0).start()

#Llamamos a la librería para leer del lector RFID
reader = SimpleMFRC522()

#Conectamos con la base de datos
con = psycopg2.connect(dbname='acceso', user='postgres', password='basededatos', host='192.168.0.33', port='5432', sslmode='require')

GPIO.setmode(GPIO.BOARD)
GPIO.setup(40, GPIO.OUT)
GPIO.setup(38, GPIO.OUT)
GPIO.setup(36, GPIO.OUT)
GPIO.output(40, True)
GPIO.output(38, False)
GPIO.output(36, False)

while(1):
    try:
        print("Esperando una tarjeta RFID")
        #Se lee el ID de la tarjeta RFID y su campo de texto
        id, text = reader.read()
        print(id)
        #print(text)

        userId = (text,)
        cardId = (id,)
        cur = con.cursor()
        cur.execute("SELECT * FROM users WHERE idCard='%s'", cardId)
        usuario = cur.fetchone()
        
        #Si existe algún usuario con dicha tarjeta asociada se procede a iniciar la detección facial
        if(usuario != None and int(usuario[4]) == int(id)):
            GPIO.output(38, True)
            #opencv
            print("Camienza la detección facial")
            
            #Se cargan las caras codificadas y el clasificador
            data = pickle.loads(open(args["encodings"], "rb").read())
            classifier = cv2.CascadeClassifier(args["cascade"])
            
            #Comienza el temporizador de 10 segundos para identificarse facialmente
            start = time.time()
            end = 0
            control = 0
            #Mientras no se acabe el tiempo de detección o se detecte una cara se debe analizar cada fotograma del streaming
            while (end - start < 10 and control == 0):
                #Se coge un fotograma y se escala para no saturar la raspi,
                #en caso de contar con HW más potente se puede aumentar la resolución para mayor precisión
                #frame = vs.read()
                frame = imutils.resize(vs.read(), width = 500)
                
                #Se convierte el frame a escala de grises para la detección facial...
                grayScale = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                #... y a RGB para el reconocimiento
                RGB = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

                #Se detectan las caras presentes en el frame
                detected = classifier.detectMultiScale(grayScale, scaleFactor = 1.1, minNeighbors = 5, minSize = (30, 30), flags = cv2.CASCADE_SCALE_IMAGE)

                #Las coordenas devueltas por OpenCV son (x, y, w, h) pero la librería face_recognition
                #las necesita en (top (y), right (x + w), bottom (y + h), left(x))
                locations = [(y, x + w, y + h, x) for (x, y, w, h) in detected]

                #Para cada localización de una cara se codifican sus rasgos
                encodings = face_recognition.face_encodings(RGB, locations)
                idsList = []

                #Para cada codificación generada en el frame
                for encoding in encodings:
                    #Se comprara con las caras codificadas previamente
                    matches = face_recognition.compare_faces(data["encodings"], encoding)
                    idUser = "Desconocido"

                    #Si hay un match
                    if True in matches:
                        #Índices de las todas las caras detectadas
                        matchedIndex = [i for (i, b) in enumerate(matches) if b]
                        #Diccionario para relacionar caras con "votos"
                        matchCount = {}

                        #Se cuentan los "votos" para cada cara
                        for i in matchedIndex:
                            idUser = data["ids"][i]
                            matchCount[idUser] = matchCount.get(idUser, 0) + 1

                        #La cara reconocida es la que más "votos" tiene según el sistema
                        idUser = max(matchCount, key=matchCount.get)
                    
                    #Si el usuario no es desconocido para el sistema se añade a la lista de IDs detectados
                    if(idUser != "Desconocido"):
                        idsList.append(idUser)
                
                for idUser in idsList:
                    #Para cada ID detectado se comprueba si se corresponde con el usuario cuya tarjeta fue leida
                    if (int(idUser) == int(usuario[5])):
                        print("Acces granted")
                        
                        #Se enciende el led de confirmación y se abre la puerta
                        GPIO.output(36, True)
                        control = 1
                        time.sleep(2)
                        cur.execute("INSERT INTO logs(accesstime, user_fk) VALUES (now(), %s)", (idUser,))
                        con.commit()
                        GPIO.output(36, False)
                        GPIO.output(38, False)
                
                end = time.time()
            
            #Ningún usuario autorizado fue detectado antes de que el tiempo se agotara
            if(control == 0):
                GPIO.output(38, False)
                print("User not facialy recognized")
            
        else:
            print("User or card have no granted access")

        time.sleep(1)

    except KeyboardInterrupt:
        GPIO.output(40, False)
        GPIO.output(38, False)
        GPIO.output(36, False)
        #Se para openCV y el streaming de video
        cv2.destroyAllWindows()
        vs.stop()
        
        #Cerramos la conexió con la base de datos y se limpian los GPIOs
        con.close()
        GPIO.cleanup()
        sys.exit()
 
