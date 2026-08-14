export enum TipoTarifaInterface { 
    
    // MES
    MES = "mensual", // para cuando un servicio se cobra por mes

    // DIA
    TURNO = "por turno", // se tenga las horas fijas

    // HORA
    HORA = "por hora", // para cuando un servicio sea flexible

    // SERVICIO
    SERVICIO = "por servicio" // el servicio no tiene un tiempo definido, se cobra por el servicio completo

}