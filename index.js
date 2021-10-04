const { google } = require ("googleapis");

const keys = require('./credentials.json');


const client = new google.auth.JWT(
    keys.client_email, 
    null, 
    keys.private_key, 
    ['https://www.googleapis.com/auth/spreadsheets']
);

client.authorize(function(err, tokens){
    
    if(err){
        return;
    } else {
        console.log('Conected!!')
        gsrun(client);
    }
});
   

async function gsrun(cl){

    const gsapi = google.sheets({version:'v4', auth: cl});

    // Pegando as faltas
    const faltas = {
        spreadsheetId : "1YQOQ_Qd6X4xlTDGRVAXmUK6QWBhuAYxuCe65_3FYTYE",
        range: 'engenharia_de_software!C4:C27'
    };
    //Pegando as notas
    const notas = {
        spreadsheetId : "1YQOQ_Qd6X4xlTDGRVAXmUK6QWBhuAYxuCe65_3FYTYE",
        range: 'engenharia_de_software!D4:F27'
    };
    
    let data = await gsapi.spreadsheets.values.get(faltas);
    let dataN = await gsapi.spreadsheets.values.get(notas);
    let dataFaltas = data.data.values;
    let arrayNotas = dataN.data.values;
    
    let resultFault = [];
    for(let i of dataFaltas){
        if( i > 15){
            resultFault.push('Reprovado por Falta');
        }else{
            resultFault.push(i);
        }
    }
    // m<50 .......... reprovado por Nota
    // 50 <= m <70.... Exame Final
    // m >70 ......... Aprovado

    //naf = 50 <= (m + naf)/2
    let m = calcMedia(arrayNotas);
    let situacao = [];
    let naf = [];

    for(let i of m){
        naf.push(100-i);
    }
  
    
    for(let i=0; i<24 ; i++){
        if(resultFault[i] == 'Reprovado por Falta')situacao.push(resultFault[i]);
        else if(m[i] < 50)situacao.push('reprovado por Nota');
        else if(m[i] >= 50 && m[i]<70)situacao.push('Exame Final');
        else{situacao.push('Aprovado')}
    }

   
    //function to calculate Media
    function calcMedia(Array){
        let newArray = [];
        let result = [];
        for(let i of Array){
            newArray.push(i.map(i=> Number(i)));
        }
        for(let i of newArray){
        result.push(i.reduce((ac, value)=>ac+value));  
    }
        return result.map((i)=>Math.ceil(i/3));
    }
    //function to convert the answer to right sintax to write in the sheet
    function convertArray(num){
        let arrayInicio = [];
        let arrayFinal = [];
        for(let i =0; i<num.length; i++){
            arrayInicio.push([num[i], num[i+1]])
        }
        for(let i in arrayInicio){
            if(i % 2 == 0)arrayFinal.push(arrayInicio[i]);
        }
        return arrayFinal;
    }

    resultTemp = [];
    for(let i in situacao){
        if(situacao[i] === 'Exame Final'){
            resultTemp.push(situacao[i]);
            resultTemp.push(naf[i]);
        }
        else if(situacao[i] ==='Reprovado por Falta'){
            resultTemp.push(situacao[i]);
            resultTemp.push(0);
        }
        else if(situacao[i] ==='reprovado por Nota'){
            resultTemp.push(situacao[i]);
            resultTemp.push(0);
        }
        else if(situacao[i] ==='Aprovado'){
            resultTemp.push(situacao[i]);
            resultTemp.push(0);
        }

    }

    let result = convertArray(resultTemp);


    const updateOptions = {
        spreadsheetId : "1YQOQ_Qd6X4xlTDGRVAXmUK6QWBhuAYxuCe65_3FYTYE",
        range: 'engenharia_de_software!G4',
        valueInputOption: 'USER_ENTERED',
        resource: { values: result }
    };

    let res = await gsapi.spreadsheets.values.update(updateOptions);

}
