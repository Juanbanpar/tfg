#Uso:
#Para dispositivos potentes
#python encode.py --data data --encodings encodings.pickle --method cnn
#Para dispositivos poco potentes como la raspberry
#python encode.py --data data --encodings encodings.pickle --method hog

import argparse
import pickle
import os
from imutils import paths
import face_recognition
import cv2

#Parser de argumentos
parser = argparse.ArgumentParser()
parser.add_argument("-d", "--data", required=True, help="Path con las caras a codificar (idusuario/imagenes)")
parser.add_argument("-e", "--encodings", required=True, help="Path de salida para las caras codificadas")
parser.add_argument("-m", "--method", required=True, help="Modelo para la detección facial: 'hog' para dispostivos lentos o 'cnn' para dispostivos potentes")
args = vars(parser.parse_args())

#Se cargan la lista de directorios con imagenes para el dataset
imagePaths = list(paths.list_images(args["data"]))

#Lista de codificaciones e IDs
encodingsList = []
idsList = []

#Bucle sobre la lista de directorios
for imagePath in imagePaths:
    #Obtener el id de la persona del path
    idUser = imagePath.split(os.path.sep)[-2]

    #Se lee la imagen con openCV (BGR)
    image = cv2.imread(imagePath)
    #Y se convierte al modelo de color de dlib (RGB)
    RGB = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    #Detectar las coordenadas (x, y) de la caras de las imagenes en RGB utilizando el método pasado por parámetro
    locations = face_recognition.face_locations(RGB, model = args["method"])

    #Se codifican los datos obtenidos
    encodings = face_recognition.face_encodings(RGB, locations)

    #Cada codificación se añade a la lista de coficiaciones y el ID de la persona a lista de IDs
    for encoding in encodings:
        encodingsList.append(encoding)
        idsList.append(idUser)

#Se guardan los datos a disco en un fichero .pickle
print("Imagenes codificadas, guardando el fichero")
data = {"encodings": encodingsList, "ids": idsList}
dataFile = open(args["encodings"], "wb")
dataFile.write(pickle.dumps(data))
dataFile.close()
print("Fichero guardado, proceso completado")
