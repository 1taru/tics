#include <SPI.h>
#include <MFRC522.h>
#include <WiFi.h>
#include <HTTPClient.h>

#define SS_PIN 5
#define RST_PIN 22
#define RELAY 15 // Pin del Relay

MFRC522 mfrc522(SS_PIN, RST_PIN); // Crea la instancia MFRC522

// Configura tu red Wi-Fi
const char *ssid = "red_paraTics";
const char *password = "123456";
const char *serverUrl = "http://localhost:3000/solicitud"; // Reemplaza con la URL de tu servidor

void setup()
{
  Serial.begin(115200); // Inicializa la comunicación serial
  SPI.begin();          // Inicializa el bus SPI
  mfrc522.PCD_Init();   // Inicializa el MFRC522
  pinMode(RELAY, OUTPUT);
  digitalWrite(RELAY, HIGH);
  Serial.print("Ponga su Tarjeta para la lectura...");
  Serial.println();

  // Conéctate a la red Wi-Fi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED)
  {
    delay(1000);
    Serial.println("Conectando a WiFi...");
  }
  Serial.println("Conexión WiFi establecida");
}

void loop()
{
  // Mirando para nuevas tarjetas
  if (!mfrc522.PICC_IsNewCardPresent())
  {
    return;
  }
  // Selecciona una de las tarjetas
  if (!mfrc522.PICC_ReadCardSerial())
  {
    return;
  }

  // Muestra el UID sobre el Monitor Serial
  Serial.print("UID tag :");
  String content = "";
  byte letter;
  for (byte i = 0; i < mfrc522.uid.size; i++)
  {
    Serial.print(mfrc522.uid.uidByte[i] < 0x10 ? " 0" : " ");
    Serial.print(mfrc522.uid.uidByte[i], HEX);
    content.concat(String(mfrc522.uid.uidByte[i] < 0x10 ? " 0" : " "));
    content.concat(String(mfrc522.uid.uidByte[i], HEX));
  }
  Serial.println();
  Serial.print("Message : ");
  content.toUpperCase();

  // Enviar solicitud POST al servidor
  sendPostRequest(content);
}

void sendPostRequest(String rfid)
{
  HTTPClient http;

  // Construir la URL para la solicitud POST
  String url = serverUrl;

  // Configurar la solicitud POST
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  // Construir el cuerpo de la solicitud JSON
  String requestBody = "{\"rfid\":\"" + rfid + "\", \"nombre\":\"\", \"sensor1\":\"\", \"sensor2\":\"\"}";

  // Realizar la solicitud POST
  int httpResponseCode = http.POST(requestBody);

  if (httpResponseCode > 0)
  {
    Serial.print("Solicitud POST exitosa. Código de respuesta: ");
    Serial.println(httpResponseCode);
  }
  else
  {
    Serial.print("Error en la solicitud POST. Código de respuesta: ");
    Serial.println(httpResponseCode);
  }

  // Liberar recursos
  http.end();
}
