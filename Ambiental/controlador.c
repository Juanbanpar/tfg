#include <unistd.h>    
#include <fcntl.h>    
#include <sys/ioctl.h>     
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <time.h>
#include <linux/i2c-dev.h>

//Definición del dispositivo I2C y la longitud de las peticiones/respuestas
#define DEVICE_ID 0x08
#define MSG_LEN 8

//Variables para la comunicación I2C
int fd_i2c;
char filename[20];

//Variables para almacenar los valores ambientales leidos
double temp = 0.0;
double hum = 0.0;
int dust = 0;
int lit = 0;

int refrigeration = 0;
int ventilation = 0;

//Tiempo de espera para leer del arduino la respuesta a la petición
struct timespec time_msg = {0,400000000};

/*
 * Función para leer la temperatura
 */
int read_temp() {
    char request[10];
    char answer[10];

    //Se vacían la petición y la respuesta
    memset(request, '\0', 10);
    memset(answer, '\0', 10);
    
    //Petición de temperatura
    strcpy(request, "TMP: REQ\n");
    
    //Se escribe y se lee en I2C
    write(fd_i2c, request, MSG_LEN);
    nanosleep(&time_msg, NULL);
    read(fd_i2c, answer, MSG_LEN);
    
    if (1 == sscanf(answer, "TMP:%lf\n", &temp)) {
        printf("Temperatura actual: %lf\n", temp);
        
        to_json();
        return 0;
    } else {
        to_json();
        return -1;
    }
}

/*
 * Función para leer la humedad
 */
int read_hum() {
    char request[10];
    char answer[10];

    //Se vacían la petición y la respuesta
    memset(request, '\0', 10);
    memset(answer, '\0', 10);
    
    //Petición de la humedad
    strcpy(request, "HUM: REQ\n");
    
    //Se escribe y se lee en I2C
    write(fd_i2c, request, MSG_LEN);
    nanosleep(&time_msg, NULL);
    read(fd_i2c, answer, MSG_LEN);
    
    if (1 == sscanf(answer, "HUM:%lf\n", &hum)) {
        printf("Humedad actual: %lf\n", hum);
        
        to_json();
        return 0;
    } else {
        to_json();
        return -1;
    }
}

/*
 * Función para leer la concentración de partículas PM2.5 en el aire
 */
int read_dust() {
    char request[10];
    char answer[10];

    //Se vacían la petición y la respuesta
    memset(request, '\0', 10);
    memset(answer, '\0', 10);
    
    // request temp
    strcpy(request, "DST: REQ\n");
    
    //Se escribe y se lee en I2C
    write(fd_i2c, request, MSG_LEN);
    nanosleep(&time_msg, NULL);
    read(fd_i2c, answer, MSG_LEN);
    
    if (1 == sscanf(answer, "DST: %d\n", &dust)) {
        printf("Partículas PM2.5 actuales: %d\n", dust);
        
        to_json();
        return 0;
    } else {
        to_json();
        return -1;
    }
}

/*
 * Función para leer la luminosidad actual,
 * la respuesta es un porcentaje siendo 100
 * el valor más alto de luminosidad que alumbran
 * las luces del CPD y 0 cuando todas se apagan
 */
int read_lit() {
    char request[10];
    char answer[10];

    //Se vacían la petición y la respuesta
    memset(request, '\0', 10);
    memset(answer, '\0', 10);

    // request light
    strcpy(request, "LIT: REQ\n");

    //Se escribe y se lee en I2C
    write(fd_i2c, request, MSG_LEN);
    nanosleep(&time_msg, NULL);
    read(fd_i2c, answer, MSG_LEN);
    
    // display light
    if (1 == sscanf(answer, "LIT: %d%%", &lit)) {
        if (lit > 50) {
            printf("Las luces están encendidas: %d\n", lit);
        }
        else {
            printf("Las luces están apagadas: %d\n", lit);
        }
    }
    
    to_json();
    return 0;
}

/*
 * Función para aplicar un porcentaje de actuación
 * al sistema de refrigeración del CPD, siendo 100
 * el más alto y 0 el más bajo.
 * Dicho valor dependerá de la temperatura actual leida
 */
int set_ref() {
    char request[10];
    char answer[10];

    //Se vacían la petición y la respuesta
    memset(request, '\0', 10);
    memset(answer, '\0', 10);

    if (temp <= 20) {
        strcpy(request, "REF:   0\n");
        //Se escribe y se lee en I2C
        write(fd_i2c, request, MSG_LEN);
        nanosleep(&time_msg, NULL);
        read(fd_i2c, answer, MSG_LEN);
        
        // display ref
        if (0 == strcmp(answer, "REF: SET")) {
            refrigeration = 0;
            printf("La refrigeración funciona al %d %%\n", refrigeration);
        }
        if (0 == strcmp(answer, "MSG: ERR")) return -1;
    } else if (temp >= 21 && temp < 23) {
        strcpy(request, "REF:  20\n");
        //Se escribe y se lee en I2C
        write(fd_i2c, request, MSG_LEN);
        nanosleep(&time_msg, NULL);
        read(fd_i2c, answer, MSG_LEN);
        
        // display ref
        if (0 == strcmp(answer, "REF: SET")) {
            refrigeration = 20;
            printf("La refrigeración funciona al %d %%\n", refrigeration);
        }
        if (0 == strcmp(answer, "MSG: ERR")) return -1;
    } else if (temp >= 23 && temp < 25) {
        strcpy(request, "REF:  50\n");
        //Se escribe y se lee en I2C
        write(fd_i2c, request, MSG_LEN);
        nanosleep(&time_msg, NULL);
        read(fd_i2c, answer, MSG_LEN);
        
        // display ref
        if (0 == strcmp(answer, "REF:  OK")) {
            refrigeration = 50;
            printf("La refrigeración funciona al %d %%\n", refrigeration);
        }
        if (0 == strcmp(answer, "MSG: ERR")) return -1;
    } else if (temp >= 25 && temp < 27) {
        strcpy(request, "REF:  70\n");
        //Se escribe y se lee en I2C
        write(fd_i2c, request, MSG_LEN);
        nanosleep(&time_msg, NULL);
        read(fd_i2c, answer, MSG_LEN);
        
        // display ref
        if (0 == strcmp(answer, "REF: SET")) {
            refrigeration = 70;
            printf("La refrigeración funciona al %d %%\n", refrigeration);
        }
        if (0 == strcmp(answer, "MSG: ERR")) return -1;
    } else if (temp >= 27) {
        strcpy(request, "REF: 100\n");
        //Se escribe y se lee en I2C
        write(fd_i2c, request, MSG_LEN);
        nanosleep(&time_msg, NULL);
        read(fd_i2c, answer, MSG_LEN);
        
        // display ref
        if (0 == strcmp(answer, "REF: SET")) {
            refrigeration = 100;
            printf("La refrigeración funciona al %d %%\n", refrigeration);
        }
        if (0 == strcmp(answer, "MSG: ERR")) return -1;
    }
    
    //printf(answer);
    to_json();
    
    return 0;
}

/*
 * Función para aplicar un porcentaje de actuación
 * al sistema de ventilación del CPD, siendo 100
 * el más alto y 0 el más bajo.
 * Dicho valor dependerá de la humedad y las partículas PM2.5
 * actuales leidas
 */
int set_vent() {
    char request[10];
    char answer[10];

    //Se vacían la petición y la respuesta
    memset(request, '\0', 10);
    memset(answer, '\0', 10);

    if (hum <= 40 && dust <= 35) {
        strcpy(request, "VEN:   0\n");
        //Se escribe y se lee en I2C
        write(fd_i2c, request, MSG_LEN);
        nanosleep(&time_msg, NULL);
        read(fd_i2c, answer, MSG_LEN);
        
        // display vent
        if (0 == strcmp(answer, "VEN: SET")) {
            ventilation = 0;
            printf("La ventilación funciona al %d %%\n", ventilation);
        }
        if (0 == strcmp(answer, "MSG: ERR")) return -1;
    } else if ((hum >= 45 && hum < 50) || (dust >= 50 && dust < 75)) {
        strcpy(request, "VEN:  20\n");
        //Se escribe y se lee en I2C
        write(fd_i2c, request, MSG_LEN);
        nanosleep(&time_msg, NULL);
        read(fd_i2c, answer, MSG_LEN);
        
        // display vent
        if (0 == strcmp(answer, "VEN: SET")) {
            ventilation = 20;
            printf("La ventilación funciona al %d %%\n", ventilation);
        }
        if (0 == strcmp(answer, "MSG: ERR")) return -1;
    } else if ((hum >= 50 && hum < 55) || (dust >= 75 && dust < 90)) {
        strcpy(request, "VEN:  50\n");
        //Se escribe y se lee en I2C
        write(fd_i2c, request, MSG_LEN);
        nanosleep(&time_msg, NULL);
        read(fd_i2c, answer, MSG_LEN);
        
        // display vent
        if (0 == strcmp(answer, "VEN: SET")) {
            ventilation = 50;
            printf("La ventilación funciona al %d %%\n", ventilation);
        }
        if (0 == strcmp(answer, "MSG: ERR")) return -1;
    } else if ((hum >= 55 && hum < 60) || (dust >= 90 && dust < 115)) {
        strcpy(request, "VEN:  70\n");
        //Se escribe y se lee en I2C
        write(fd_i2c, request, MSG_LEN);
        nanosleep(&time_msg, NULL);
        read(fd_i2c, answer, MSG_LEN);
        
        // display vent
        if (0 == strcmp(answer, "VEN: SET")) {
            ventilation = 70;
            printf("La ventilación funciona al %d %%\n", ventilation);
        }
        if (0 == strcmp(answer, "MSG: ERR")) return -1;
    } else if (hum >= 60 || dust >= 115) {
        strcpy(request, "VEN: 100\n");
        //Se escribe y se lee en I2C
        write(fd_i2c, request, MSG_LEN);
        nanosleep(&time_msg, NULL);
        read(fd_i2c, answer, MSG_LEN);
        
        // display vent
        if (0 == strcmp(answer, "VEN: SET")) {
            ventilation = 100;
            printf("La ventilación funciona al %d %%\n", ventilation);
        }
        if (0 == strcmp(answer, "MSG: ERR")) return -1;
    }
    
    //printf(answer);
    to_json();
    
    return 0;
}


/*
 * Función para escirbir los valores a un fichero JSON
 */
int to_json() {
    //Fichero JSON al que se guardan los datos leidos
    FILE *fptr_json;
    
    //Se intenta abir el fichero JSON donde se va a escribir
    if ((fptr_json = fopen("./data.json","w")) == NULL) {
        printf("Error abriendo el fichero JSON\n");   
        return -1; 
    }
    
    printf("Se escribe a JSON\n");
    fprintf(fptr_json, "{\n\t\"temperature\": %lf,\n\t\"humidity\": %lf,\n\t\"dust\": %d,\n\t\"luminosity\": %d,\n\t\"refrigeration\": %d,\n\t\"ventilation\": %d\n}", temp, hum, dust, lit, refrigeration, ventilation);
    
    fclose(fptr_json);
    return 0;
}

int main(int argc, char** argv[]){
    
    //Se abre el bus I2C
    snprintf(filename, 19, "/dev/i2c-%d", 1);
    fd_i2c = open(filename, O_RDWR);
    if (fd_i2c < 0) {
        printf("Error al iniciar la comunicación I2C\n");
        return -1;
    } else {
        printf("Comunicación I2c correctamente establecida\n");
    }

    //Conexión al esclavo I2C
    if (ioctl(fd_i2c, I2C_SLAVE, DEVICE_ID) < 0)
    {
        printf("Error al adquirir acceso al bus o al comuicarse con el esclavo\n");
        return -1;
    }
      
    //Planificación cíclica
    while(1) {
        read_temp();
        sleep(5);
        read_hum();
        sleep(5);
        read_dust();
        sleep(5);
        read_lit();
        sleep(5);
        set_ref();
        sleep(5);
        set_vent();
        sleep(5);
    }
    
    //Se cierra le fichero JSON
    //fclose(fptr_json);
    
}
