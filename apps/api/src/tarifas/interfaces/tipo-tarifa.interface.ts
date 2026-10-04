export enum TipoTarifaInterface { 
    
    // MES
    MES = "mensual", // para cuando un servicio se cobra por mes

    // DIA
    TURNO = "por turno", // se tenga las horas fijas

    // SERVICIO
    SERVICIO = "por servicio" // el servicio no tiene un tiempo definido, se cobra por el servicio completo

}