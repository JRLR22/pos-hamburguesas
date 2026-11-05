// Cada archivo de tests corre con su propia base de datos en memoria.
process.env.DB_PATH = ':memory:';
process.env.JWT_SECRET = 'secreto-solo-para-tests-0123456789abcdef';
process.env.NODE_ENV = 'test';
process.env.IMPRIMIR_AUTOMATICO = 'false';
