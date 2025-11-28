const qrcode = require('qrcode-terminal');
const { Client } = require('whatsapp-web.js');
//solisitar archivos
const path = require("path");
const fs = require('fs');
const SESSION_FILE_PATH = './whatsapp-session.json';
const axios = require("axios");//Precio del dolar


//menu
const menuPath = path.join(__dirname, "mensajes", "menu.txt");
const menu = fs.readFileSync(menuPath, "utf8");
//forma de pagos
const pagoPath = path.join(__dirname, "mensajes", "pagos.txt");
const metodosPagos = fs.readFileSync(pagoPath, "utf8");
const arrayPagos = metodosPagos.split(",");
//Planes
const panPath = path.join(__dirname, "mensajes", "planes.txt");
const planes = fs.readFileSync(panPath, "utf8");
const arrayPlanes = planes.split(",");

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise);
  console.error("Reason:", reason);
});


//clientes...
const clientePath = path.join(__dirname, "backup", "clientes.csv");
const clientes = fs.readFileSync(clientePath, "utf8");

// Cada línea normalmente separada por salto de línea
const lineas = clientes.split('\n');

const cantidadRegistro = lineas.length;
const cantidadRegistroAgregados = cantidadRegistro - 1;

lineas.forEach((linea, i) => {
  // Saltar cabecera y leer máximo 10 registros
  if (i !== 0) {
    const datos = linea.split(';');

    // Usar columnas con índice según CSV
    /*
    const id_cliente = datos[0]?.trim() || '';
    const nombre_cliente = datos[1]?.trim() || '';
    const servicio = datos[2]?.trim() || '';
    const ip = datos[3]?.trim() || '';
    const estado = datos[4]?.trim() || '';
    const plan = datos[5]?.trim() || '';
    const cedula = datos[6]?.trim() || '';
    const direccion = datos[7]?.trim() || '';
    const telefono = datos[8]?.trim() || '';
    const fechaInstalacion = datos[9]?.trim() || '';
*/
    //console.log(`Registro ${i}: ${id_cliente} - ${nombre_cliente} - ${servicio}`);

    // Aquí puede continuar con el procesamiento o exportar datos
  }
});

//funcion para precio del dolar
var precioEnBs = 0;
//https://v6.exchangerate-api.com/v6/5af75fe4b9d3575b0d69b224/latest/USD
async function obtenerPrecioDolar() {
  try {
    const response = await axios.get("https://open.er-api.com/v6/latest/USD");
    const precios = response.data.rates;
    precioEnBs = precios.VES; // Ejemplo para Peso Mexicano (MXN)
    console.log("Precio actual dólar a Bolivares:", precioEnBs);
  } catch (error) {
    console.error("Error al obtener precio del dólar:", error);
  }
}
obtenerPrecioDolar();


const salir = 'Bot de administración desconectado. ¡Que tengas un buen día! 👋🏻\nCuando quieras volver, solo escribe "Altanet"';


let sessionData;
if (fs.existsSync(SESSION_FILE_PATH)) {
    sessionData = require(SESSION_FILE_PATH);
}

const client = new Client({
    session: sessionData
});


// Objeto para guardar sesiones activas
const sesionesActivas = {};

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('Escanea este código QR con WhatsApp para iniciar sesión.');
});

client.on('ready', () => {
    console.log('El bot está listo para usar!');
    // Guarda la sesión para futuras ejecuciones
    fs.writeFileSync(SESSION_FILE_PATH, JSON.stringify(client.session));
});

client.on('message', async (message) => {
    const body = message.body.toLowerCase();
    const from = message.from;

    // Inicializa la sesión si no existe
    if (!sesionesActivas[from]) {
        sesionesActivas[from] = {
            activo: true,
            mensajes: [],
            fechaInicio: new Date(),
            esperandoOpcion: false,
            esperandoCedula: false,
            nombreCliente:false,
            razonCliente:false
        };
        console.log(`Sesión iniciada para: ${from}`);
    }

    

    // Guarda el mensaje en la sesión
     sesionesActivas[from].mensajes.push({ mensaje: message.body, fecha: new Date() });




//===================================

    // Responde si contiene saludo

   if(sesionesActivas[from].esperandoOpcion==false){ 
    if (body.includes('hola') || body.includes('buenos') || body.includes('buenas')|| body.includes('Altanet')) {
         sesionesActivas[from].esperandoOpcion = 'principal';
        await message.reply(`🙌¡Hola! Bienvenid@ al área administrativa de Altanet Telecom.\n${menu}`);
        return;
    }
}
   // Solo valida la opción si está esperando una respuesta
    if (sesionesActivas[from].esperandoOpcion== 'principal') {
        if (body == 1 || body == 2|| body == 3|| body == 4|| body == 0) {
            // Aquí procesas la opción válida
            

            switch (body) {
        case "1"://saldo del cliente
        sesionesActivas[from].esperandoOpcion = 'saldo';
        sesionesActivas[from].esperandoCedula = true;
        await message.reply(`Ingrese la cédula del propietario del contrato por favor`);
        return;
        case "2"://métodos de pagos
        sesionesActivas[from].esperandoOpcion = 'metodoP';
        sesionesActivas[from].esperandoCedula = true;
        await message.reply(arrayPagos[0]);
        return;

        case "3": //cuentas disponibles asesor
          sesionesActivas[from].esperandoOpcion = 'asesor';
          sesionesActivas[from].esperandoCedula = true;
          await message.reply(`Ingrese sus datos`);
          await message.reply(`*Cedula:*`);
          return;
          case "4"://incidentes con la red
          
          sesionesActivas[from].esperandoOpcion = 'incidente';
          sesionesActivas[from].esperandoCedula = true;
          await message.reply(`Ingrese sus datos`);
          await message.reply(`*Cedula:*`);
          return; 
        case "0"://salir del Bot
          await message.reply(salir);
          sesionesActivas[from].esperandoOpcion = false;
          return; 
      }

        } else {
            await message.reply("❗ Por favor, envía solo una de las opciones mencionadas: 1, 2, 3, 4 o 0");
        }
       return;
    }

 //saldo del cliente
 //======================================= 
 if(sesionesActivas[from].esperandoOpcion === 'saldo' && sesionesActivas[from].esperandoCedula){

        if (body === '0') {//menu primcipal
            sesionesActivas[from].esperandoOpcion = 'principal';
            sesionesActivas[from].esperandoCedula = false;
            await message.reply(menu);
            return;
        }



        var cedula_buscar='';
        var nombre_cliente='';
        for (let i = 1; i < lineas.length; i++) {
            var linea = lineas[i];
            var datos = linea.split(';');
            var cedula_cliente = datos[6]?.trim() || '';
 

                 if (body.trim() == cedula_cliente.trim()) {
            // Aquí puedes continuar procesando cuando la cédula coincide
            // ...
                      nombre_cliente = datos[1]?.trim() || '';//nombre del cliente
                     cedula_buscar =cedula_cliente;
                     console.log(cedula_buscar);
                     break; // Salir del bucle porque se encontró la cédula
                    } else {
                    // no es cliente de la compañía
    
                    }

        } 

    if(body.trim() == cedula_buscar.trim()){
            sesionesActivas[from].esperandoCedula = false;
            sesionesActivas[from].esperandoOpcion = 'p'
             await message.reply(arrayPlanes[0]);
             console.log('Nuevo estado:', sesionesActivas[from].esperandoOpcion);
             return;
        }else{
            var error =`❗La cédula ingresada no corresponde\na ningún cliente, ingresa una nuevamente\n*O ingrese:*\n0-Para regresar al menu principal`;
            await message.reply(error.trim());
            
        }
     
    }

    //plan del cliente
    if (sesionesActivas[from].esperandoOpcion === 'p' || sesionesActivas[from].esperandoCedula == false) {//dar elegir los planes del cliente

         if (body == 1 || body == 2|| body == 3|| body == 4|| body == 0) {
     switch (body) {
      case "1":
        var bolivares = arrayPlanes[1].trim() * precioEnBs;
        await message.reply(
          arrayPlanes[1].trim() +
            " Dolares\n" +
            bolivares.toFixed(2) +
            " Bolivares\n" +
            arrayPlanes[5].trim()); //plan Megas
             return;
      case "2":
        var bolivares = arrayPlanes[2].trim() * precioEnBs;
        await message.reply(
          arrayPlanes[2].trim() +
            " Dolares\n" +
            bolivares.toFixed(2) +
            " Bolivares\n" +
            arrayPlanes[5].trim()); //plan Megas
             return;
      case "3":
        var bolivares = arrayPlanes[3].trim() * precioEnBs;
       await message.reply(
          arrayPlanes[3].trim() +
            " Dolares\n" +
            bolivares.toFixed(2) +
            " Bolivares\n" +
            arrayPlanes[5].trim()); //Plan Premiun
         return;
      case "4":
        var bolivares = arrayPlanes[4].trim() * precioEnBs;
         //Plan Platino
        await message.reply(
          arrayPlanes[4].trim() +
            " Dolares\n" +
            bolivares.toFixed(2) +
            " Bolivares\n" +
            arrayPlanes[5].trim());
        return;
      case "0":
        await message.reply(menu);
        sesionesActivas[from].esperandoOpcion = 'principal';
          return;  //menu primcipal
    }
     
    }else{
         await message.reply("❗ Por favor, envía solo una de las opciones mencionadas: 1, 2, 3, 4 o 0");
         
    }
        
    }
//===============================

//metodos de pagos

    if (sesionesActivas[from].esperandoOpcion === 'metodoP' || sesionesActivas[from].esperandoCedula == false) {//dar elegir los planes del cliente

         if (body == 1 || body == 2|| body == 3|| body == 4|| body == 0) {
     switch (body) {
        case "1":
          await message.reply(arrayPagos[1].trim());
          return; //Cuenta Zelle

        case "2": //Cuenta Binance
          await message.reply(arrayPagos[2].trim());
          return; 

        case "3": //transferencia
          await message.reply(arrayPagos[3].trim());
          return; 

        case "4": //transferencia
          await message.reply(arrayPagos[4].trim());
          return; 
        
        case "0": //primcipal
          await message.reply(menu);
        sesionesActivas[from].esperandoOpcion = 'principal';
          return;  //menu primcipal
      }
     
    }else{
         await message.reply("❗ Por favor, envía solo una de las opciones mencionadas: 1, 2, 3, 4 o 0");
         
    }
        
    }
//==================================================
//asesor de ventas
 var nombre_cliente='';
if(sesionesActivas[from].esperandoOpcion === 'asesor' && sesionesActivas[from].esperandoCedula){

        if (body === '0') {//menu primcipal
            sesionesActivas[from].esperandoOpcion = 'principal';
            sesionesActivas[from].esperandoCedula = false;
            await message.reply(menu);
            return;
        }



        var cedula_buscar='';
       
        for (let i = 1; i < lineas.length; i++) {
            var linea = lineas[i];
            var datos = linea.split(';');
            var cedula_cliente = datos[6]?.trim() || '';
 

                 if (body.trim() == cedula_cliente.trim()) {
            // Aquí puedes continuar procesando cuando la cédula coincide
            // ...
                      nombre_cliente = datos[1]?.trim() || '';//nombre del cliente
                     cedula_buscar =cedula_cliente;
                     console.log(cedula_buscar);
                     break; // Salir del bucle porque se encontró la cédula
                    } else {
                    // no es cliente de la compañía
    
                    }

        } 

    if(body.trim() == cedula_buscar.trim()){
            sesionesActivas[from].esperandoCedula = false;
            sesionesActivas[from].esperandoOpcion = 'razon'
             await message.reply(`Razón de su solicitud:`);
             console.log('Nuevo estado:', sesionesActivas[from].esperandoOpcion);
             return;
        }else{
            var error =`❗La cédula ingresada no corresponde\na ningún cliente, ingresa una nuevamente\n*O ingrese:*\n0-Para regresar al menu principal`;
            await message.reply(error.trim());
            
        }
     
    }

    //razon
    if (sesionesActivas[from].esperandoOpcion === 'razon' || sesionesActivas[from].esperandoCedula == false) {//dar elegir los planes del cliente

        await message.reply(`Gracias ${nombre_cliente}, He registrado su solicitud. Te atenderemos en la brevedad posible`);
        await message.reply(`Cuando quieras volver, solo escribe "Altanet"`);
        return;
        
    }
//==========================================
//incidentes

if(sesionesActivas[from].esperandoOpcion === 'incidente' && sesionesActivas[from].esperandoCedula){

        if (body === '0') {//menu primcipal
            sesionesActivas[from].esperandoOpcion = 'principal';
            sesionesActivas[from].esperandoCedula = false;
            await message.reply(menu);
            return;
        }



        var cedula_buscar='';
       
        for (let i = 1; i < lineas.length; i++) {
            var linea = lineas[i];
            var datos = linea.split(';');
            var cedula_cliente = datos[6]?.trim() || '';
 

                 if (body.trim() == cedula_cliente.trim()) {
            // Aquí puedes continuar procesando cuando la cédula coincide
            // ...
                      nombre_cliente = datos[1]?.trim() || '';//nombre del cliente
                     cedula_buscar =cedula_cliente;
                     console.log(cedula_buscar);
                     break; // Salir del bucle porque se encontró la cédula
                    } else {
                    // no es cliente de la compañía
    
                    }

        } 

    if(body.trim() == cedula_buscar.trim()){
            sesionesActivas[from].esperandoCedula = false;
            sesionesActivas[from].esperandoOpcion = 'razonR'
             await message.reply(`"¿Cual es el incidente que decae reportar?`);
             console.log('Nuevo estado:', sesionesActivas[from].esperandoOpcion);
             return;
        }else{
            var error =`❗La cédula ingresada no corresponde\na ningún cliente, ingresa una nuevamente\n*O ingrese:*\n0-Para regresar al menu principal`;
            await message.reply(error.trim());
            
        }
     
    }

    //razon
    if (sesionesActivas[from].esperandoOpcion === 'razonR' || sesionesActivas[from].esperandoCedula == false) {//dar elegir los planes del cliente

        await message.reply(`De click al link para escribir a soporte técnico`);
        await message.reply(`https://api.whatsapp.com/send?phone=584126356538&text=${body}`);
        await message.reply(`Cuando quieras volver, solo escribe "Altanet"`);
        
        return;
        
    }




});

client.initialize();

// Para ver sesiones activas (puedes usar esto en otro lugar o para debugging)
setInterval(() => {
    console.log('Sesiones activas:', Object.keys(sesionesActivas));
}, 60000); // Cada minuto
