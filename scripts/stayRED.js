const rg_3819 = 0.30, iva = 0.21, mup_Ricale = 0.80, comi_Ricale = 0.20;
const comi_Prom = 0.10, trf_charge = 0.012, rg_4815 = 0.05;

// Detectamos la moneda seleccionada en el formulario
//const monedaSeleccionada = document.getElementById('pay_curr').value === 'Pesos' ? 'ARS' : 'USD';

// Función para formatear moneda
function formatCurrency(valor, moneda) {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: moneda,
    }).format(valor);
}

let datosCoti = {};

function calcular() {
    const d = {
        dest: document.getElementById('srv_dest').value,
        pCurr: document.getElementById('pay_curr').value,
        pTipe: document.getElementById('pay_tipe').value,
        sCurr: document.getElementById('stayred_curr').value,
        fare: parseFloat(document.getElementById('stayred_fare').value) || 0,
        tdc: parseFloat(document.getElementById('stayred_tdc').value) || 0,
        sfee: parseFloat(document.getElementById('srv_fee').value) || 0,
        cli: document.getElementById('client_info').value,
        cuit: document.getElementById('client_cuit').value,
        pnr: document.getElementById('client_pnr').value
    };
    
    // Validaciones del código original
    if (!d.dest || !d.pCurr || !d.pTipe || d.fare === 0) { swal("Verificar los Datos","Todos los campos son obligatorios para realizar la cotización.","error"); return; }
    if (d.pTipe === "Tarjeta" && d.pCurr === "Dólares") { swal("","Por el momento NO estan habilitados los pagos en Dólares con Tarjeta de Crédito.","error" ); return; }
    if (d.pTipe === "Tarjeta" && d.dest === "Internacional") { swal("","Consultar pagos al exterior con tarjeta a comercial@ricale.com","warning"); return; }
    if (d.dest === "Cabotaje" && d.pCurr === "Dólares") { swal("","Servicios en Argentina deben pagarse en Pesos.","warning"); return; }
    if (d.pCurr === "Pesos" && !d.tdc) { swal("","Ingrese el Tipo de Cambio StayRED.","warning"); return; }
    if (d.fare<0 || d.tdc<0 || d.sfee<0) {swal("Psst. Por favor,","Verificá que todos los valores deben ser mayores o igual a cero","warning"); return;}

    let prod_fare = 0 ;
    let prod_tax = 0 ;
    
        
    // Lógica de Impuestos StayRED
    if (d.dest === "Cabotaje" && d.pCurr === "Pesos") {
        prod_fare = (d.fare / (1 + iva)) * d.tdc;
        prod_tax = prod_fare * iva;           
    } else if (d.dest === "Internacional" && d.pCurr === "Pesos") {
        prod_fare = d.fare * d.tdc;
        prod_tax = ((prod_fare * comi_Ricale) * iva) + ((prod_fare * mup_Ricale) * rg_3819);
    } else { 
        prod_fare = d.fare;
        prod_tax = (prod_fare * comi_Ricale) * iva;
    }
    
    let new_sfee = 0;
    if (d.pCurr === "Pesos") { new_sfee = d.sfee*d.tdc } else new_sfee = d.sfee

    const prod_cost = prod_fare + prod_tax;
    const val_prod = prod_cost + new_sfee;
    const prod_comi = prod_fare * comi_Prom;
    const rent_final = prod_comi + (new_sfee / 1.21);
    
    let sale_info = 0;
    if (d.pTipe === "Transferencia" || (d.pTipe === "Deposito" && d.dest === "Cabotaje")) {
        sale_info = val_prod / (1 - trf_charge);
    } else if (d.pTipe === "Deposito" && d.dest === "Internacional") {
        let val_rg_4815 = (prod_fare * mup_Ricale) * rg_4815;
        sale_info = (val_prod + val_rg_4815) / (1 - trf_charge);
    } else {
        sale_info = val_prod; 
    }
    
    const gastos = sale_info - val_prod
    

    // Actualizar Interfaz
    document.getElementById('out_pCurr').innerText = d.pCurr;
    document.getElementById('out_pTipe').innerText = d.pTipe;
    document.getElementById('out_fare').innerText = formatCurrency(prod_fare, monedaSeleccionada);
    document.getElementById('out_tax').innerText = formatCurrency(prod_tax,"ARS");
    document.getElementById('out_cost').innerText = formatCurrency(prod_cost,"ARS");
    document.getElementById('out_comi').innerText = formatCurrency(prod_comi,"ARS");
    document.getElementById('out_val_prod').innerText = formatCurrency(val_prod,"ARS");
    document.getElementById('out_sale_info').innerText = formatCurrency(sale_info,"ARS");
    document.getElementById('out_rent_final').innerText = formatCurrency(rent_final,"ARS");
    document.getElementById('out_gastos').innerText = formatCurrency(gastos,"ARS");

    datosCoti = {...d, new_sfee, prod_fare, prod_tax, prod_cost, prod_comi, val_prod, sale_info, rent_final, gastos};
    
}


function descargarPDF() {
    if (!datosCoti.sale_info) { swal("Ooops","Para descargar el PDF primero debes realizar una cotización.","warning" ); return; }

    const content = `
        <h3 style="color: #BB1010">Cotización StayRED - ${datosCoti.pnr}</h3>
        <hr>
        <h4>Datos del Cliente</h4>
        <p>ID_Cliente: ${datosCoti.cli} - CUIT: ${datosCoti.cuit} </p>
        <hr>
        <h4>Detalle de la cotización ${datosCoti.dest}</h4>
        <p>Moneda de Pago: ${datosCoti.pCurr}</p>
        <p>Forma de Pago: ${datosCoti.pTipe}</p>
        <p>Tarifa sin Impuestos: ${datosCoti.prod_fare.toFixed(2)}</p>
        <p>Impuestos y Percepciones: ${datosCoti.prod_tax.toFixed(2)}</p>
        <p>Comisión del Producto StayRED: ${datosCoti.prod_comi.toFixed(2)}</p>
        <p>Fee Adicional Promotor: ${datosCoti.new_sfee.toFixed(2)}</p>
        <p>Gastos por ${datosCoti.pTipe}: ${datosCoti.gastos.toFixed(2)}</p>
        <hr>
        <h3 style="color: #BB1010">Importe Final a Facturar al Cliente: ${datosCoti.pCurr} ${datosCoti.sale_info.toFixed(2)} </h3>
        <h3 style="color: #BB1010">Rentabilidad Total a Cobrar Neta de Impuestos: ${datosCoti.pCurr} ${datosCoti.rent_final.toFixed(2)} </h3>
        <hr>
    `;
    const element = document.getElementById('resumen-pdf');
    document.getElementById('pdf-content').innerHTML = content;
    element.style.display = 'block';
    
    html2pdf().from(element).set({
        margin: 1,
        filename: `Cotización ${datosCoti.pnr || 'StayRED'}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    }).save().then(() => { element.style.display = 'none'; });
}

function enviarEmail() {
    if (!datosCoti.sale_info) { swal("Ooops","Para enviar el mail primero debes realizar una cotización.","warning" ); return; }
    const asunto = encodeURIComponent(`Cotización StayRED - Reserva ${datosCoti.pnr}`);
    const cuerpo = encodeURIComponent(
        `Hola,\nEnvio detalles de la cotización terrestre:\n` +
        `- Detalle Reserva - Localizador: ${datosCoti.pnr}\n` +
        `- ID_Cliente: ${datosCoti.cli} - CUIT: ${datosCoti.cuit}\n` +
        `-----------------------------------------------------------------------------\n` +
        `- Forma de Pago: ${datosCoti.pTipe}\n` +
        `- Moneda: ${datosCoti.pCurr}\n` +
        `- Tarifa: ${datosCoti.prod_fare.toFixed(2)}\n` +    
        `- Impuestos: ${datosCoti.prod_tax.toFixed(2)}\n` +
        `- Fee Adicional Promotor: ${datosCoti.new_sfee.toFixed(2)}\n` +
        `- Gastos por ${datosCoti.pTipe}: ${datosCoti.gastos.toFixed(2)}\n` +
        `-----------------------------------------------------------------------------\n` +
        `- Importe Final a Facturar al Cliente: ${datosCoti.pCurr} ${datosCoti.sale_info.toFixed(2)}\n` +
        `- Rentabilidad Total a Cobrar Neta de Impuestos: ${datosCoti.pCurr} ${datosCoti.rent_final.toFixed(2)}\n` + 
        `-----------------------------------------------------------------------------\n` +
        `-   \n` +
        `-\nSaludos.`
    );
    window.location.href = `mailto:?subject=${asunto}&body=${cuerpo}`;
}

function limpiar() { location.reload(); }