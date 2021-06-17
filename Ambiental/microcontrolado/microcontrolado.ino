// --------------------------------------
// Include files
// --------------------------------------
#include <string.h>
#include <stdio.h>
#include <Wire.h>

#include "DHT.h"

// --------------------------------------
// Global Constants
// --------------------------------------
#define SLAVE_ADDR 0x8
#define MESSAGE_SIZE 8

#define DHTPIN 2                //Pin del sensor de temperatura/humedad
#define DHTTYPE DHT22           //Modelo DHT22
DHT dht(DHTPIN, DHTTYPE);

#define COV_RATIO 0.2           //ug/mmm / mv
#define NO_DUST_VOLTAGE 400     //mv

// --------------------------------------
// Global Variables
// --------------------------------------
double temp = 0.0;
double hum = 0.0;

const int dustMeasurePin = A1;
const int dustLedPower = 3;

unsigned int dustSamplingTime = 280;

float dustVoltage = 0;
int dustAdcvalue = 0;
int dustDensity = 0;

const int refLed = 8;
int refrigeration = 0;

const int ventLed = 9;
int ventilation = 0;

bool request_received = false;
bool answer_requested = false;
char request[MESSAGE_SIZE + 1];
char answer[MESSAGE_SIZE + 1];

// --------------------------------------
// Handler function: receiveEvent
// --------------------------------------
void receiveEvent(int num)
{
    char aux_str[MESSAGE_SIZE + 1];
    int i = 0;

    // read message char by char
    for (int j = 0; j < num; j++) {
        char c = Wire.read();
        if (i < MESSAGE_SIZE) {
            aux_str[i] = c;
            i++;
        }
    }
    aux_str[i] = '\0';

    // if message is correct, load it
    if ((num == MESSAGE_SIZE) && (!request_received)) {
        memcpy(request, aux_str, MESSAGE_SIZE + 1);
        request_received = true;
    }
}

// --------------------------------------
// Handler function: requestEvent
// --------------------------------------
void requestEvent()
{
    // if there is an answer send it, else error
    if (answer_requested) {
        Wire.write(answer, MESSAGE_SIZE);
        memset(answer, '\0', MESSAGE_SIZE + 1);
    }
    else {
        Wire.write("MSG: ERR", MESSAGE_SIZE);
    }

    // set answer empty
    request_received = false;
    answer_requested = false;
    memset(request, '\0', MESSAGE_SIZE + 1);
    memset(answer, '0', MESSAGE_SIZE);
} 

/*
private function
*/
int Filter(int m) {
    static int flag_first = 0, _buff[10], sum;
    const int _buff_max = 10;
    int i;
  
    if(flag_first == 0) {
        flag_first = 1;

        for(i = 0, sum = 0; i < _buff_max; i++) {
            _buff[i] = m;
            sum += _buff[i];
        }
        return m;
    } else {
        sum -= _buff[0];
        for(i = 0; i < (_buff_max - 1); i++) {
            _buff[i] = _buff[i + 1];
        }
        _buff[9] = m;
        sum += _buff[9];
    
        i = sum / 10.0;
        return i;
    }
}

// --------------------------------------
// Function: temp_req
// --------------------------------------
int temp_req()
{
    // while there is enough data for a request
    if ((request_received) && (0 == strcmp("TMP: REQ", request))) {
        //read temp
        temp = dht.readTemperature();

        char num_str[5];
        dtostrf(temp,4,1,num_str);
        sprintf(answer,"TMP:%s",num_str);
  
        // set buffers and flags
        memset(request,'\0', MESSAGE_SIZE+1);
        request_received = false;
        answer_requested = true;
    }
    return 0;
}

// --------------------------------------
// Function: hum_req
// --------------------------------------
int hum_req()
{
    // while there is enough data for a request
    if ((request_received) && (0 == strcmp("HUM: REQ", request))) {
        //read hum
        hum = dht.readHumidity();

        // send the answer for hum request
        char num_str[5];
        dtostrf(hum,4,1,num_str);
        sprintf(answer,"HUM:%s",num_str);

        // set buffers and flags
        memset(request, '\0', MESSAGE_SIZE + 1);
        request_received = false;
        answer_requested = true;
    }
    return 0;
}

// --------------------------------------
// Function: lit_req
// --------------------------------------
int lit_req()
{  
    // while there is enough data for a request
    if ( (request_received) && (0 == strcmp("LIT: REQ",request)) ) {
        int valor = analogRead(0);
        int resultado = map(valor,0,1024,0,99);

        if(resultado>=100){
            sprintf(answer,"MSG: ERR");
        
            // set buffers and flags
            memset(request,'\0', MESSAGE_SIZE+1);
            request_received = false;
            answer_requested = true;
            return 0;
        }

        // send the answer for speed request
        char num_str[3];
        dtostrf(resultado,3,0,num_str);
        sprintf(answer,"LIT: %s%%", num_str);
        
        // set buffers and flags
        memset(request,'\0', MESSAGE_SIZE+1);
        request_received = false;
        answer_requested = true;
    }
    return 0;
}

// --------------------------------------
// Function: dst_req
// --------------------------------------
int dst_req()
{  
    // while there is enough data for a request
    if ( (request_received) && (0 == strcmp("DST: REQ",request)) ) {
        
        digitalWrite(dustLedPower, HIGH);
        delayMicroseconds(dustSamplingTime);
        dustAdcvalue = analogRead(dustMeasurePin);
        digitalWrite(dustLedPower, LOW);
        
        dustAdcvalue = Filter(dustAdcvalue);
        //Convertimos le voltaje (mv)
        dustVoltage = (5000 / 1024.0) * dustAdcvalue * 11;
        
        //Se calucla la densidad a partir del voltaje
        if(dustVoltage >= NO_DUST_VOLTAGE) {
            dustVoltage -= NO_DUST_VOLTAGE;
            dustDensity = (int) (dustVoltage * COV_RATIO);
        } else {
            dustDensity = 0;
        }

        //No más de 3 cifras
        if(dustDensity > 999) {
            dustDensity = 999;
        }

        // send the answer for speed request
        char num_str[3];
        dtostrf(dustDensity,3,0,num_str);
        sprintf(answer,"DST: %s", num_str);
        
        // set buffers and flags
        memset(request,'\0', MESSAGE_SIZE+1);
        request_received = false;
        answer_requested = true;
    }
    return 0;
}

int set_ref() {
    // while there is enough data for a request
    if ( (request_received) && (0 == strncmp("REF:",request, 4)) ) {
        if (1 != sscanf(request, "REF: %d", &refrigeration)) {
            sprintf(answer,"MSG: ERR");
  
            // set buffers and flags
            memset(request,'\0', MESSAGE_SIZE+1);
            request_received = false;
            answer_requested = true;
            return 0;
        }

        Serial.println(refrigeration);
        int resultado = map(refrigeration,0,100,0,255);
        Serial.println(resultado);
        analogWrite(refLed, resultado);

        sprintf(answer,"REF: SET");
  
        // set buffers and flags
        memset(request,'\0', MESSAGE_SIZE+1);
        request_received = false;
        answer_requested = true;
   }
   return 0;
}

int set_vent() {
    // while there is enough data for a request
    if ( (request_received) && (0 == strncmp("VEN:",request, 4)) ) {
        if (1 != sscanf(request, "VEN: %d", &ventilation)) {
            sprintf(answer,"MSG: ERR");
  
            // set buffers and flags
            memset(request,'\0', MESSAGE_SIZE+1);
            request_received = false;
            answer_requested = true;
            return 0;
        }

        Serial.println(ventilation);
        int resultado = map(ventilation,0,100,0,255);
        Serial.println(resultado);
        analogWrite(ventLed, resultado);
      
        sprintf(answer,"VEN: SET");
  
        // set buffers and flags
        memset(request,'\0', MESSAGE_SIZE+1);
        request_received = false;
        answer_requested = true;
   }
   return 0;
}


// --------------------------------------
// Function: setup
// --------------------------------------
void setup()
{
    Serial.begin(9600);
    
    pinMode(dustLedPower,OUTPUT);
    pinMode(refLed,OUTPUT);
    pinMode(ventLed,OUTPUT);
    
    // Initialize I2C communications as Slave
    Wire.begin(SLAVE_ADDR);

    // Function to run when data requested from master
    Wire.onRequest(requestEvent);

    // Function to run when data received from master
    Wire.onReceive(receiveEvent);

    dht.begin();
}

// --------------------------------------
// Function: loop
// --------------------------------------
void loop()
{
    unsigned long StartTime = millis();
    temp_req();
    hum_req();
    lit_req();
    dst_req();
    set_ref();
    set_vent();
    unsigned long CurrentTime = millis();
    unsigned long ElapsedTime = CurrentTime - StartTime;
    delay(200 - ElapsedTime);
}
