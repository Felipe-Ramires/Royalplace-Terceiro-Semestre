import { fastify } from 'fastify'
import { DatabasePostgres } from './database-postgre.js'
import fastifyCors from '@fastify/cors' 
import dotenv from 'dotenv'

dotenv.config()

const server = fastify()

server.register(fastifyCors, {
  origin: '*', 
  methods: ['GET', 'POST', 'OPTIONS'], 
  allowedHeaders: ['Content-Type']
})

const database = new DatabasePostgres()

server.get('/quarto', async (request, reply) => {
  try {
    const filters = {
      hotel: request.query.hotel,
      tipo: request.query.tipo,
      capacidade: request.query.capacidade
    };
    const quartos = await database.list(filters); 
    return quartos;
  } catch (error) {
    console.error('Erro ao buscar quartos:', error);
    return reply.status(500).send({ error: 'Erro interno ao buscar quartos' });
  }
});

server.post('/reservas', async (request, reply) => {
  try {
    const {
      nome, 
      data_nascimento,
      cpf,
      telefone,
      email,
      quarto_id, 
      num_hospedes,
      checkin, 
      checkout, 
      
    } = request.body;

    if (!nome || !cpf || !email || !quarto_id || !num_hospedes || !checkin || !checkout || !data_nascimento) {
      return reply.status(400).send({ error: 'Todos os campos obrigatórios para a reserva devem ser preenchidos (nome, cpf, email, data_nascimento, quarto_id, num_hospedes, checkin, checkout).' });
    }
    
    const dataCheckinObj = new Date(checkin);
    const dataCheckoutObj = new Date(checkout);
    const hoje = new Date();
    hoje.setHours(0,0,0,0);

    if (dataCheckinObj < hoje) {
        return reply.status(400).send({ error: 'A data de check-in não pode ser no passado.' });
    }
    if (dataCheckoutObj <= dataCheckinObj) {
        return reply.status(400).send({ error: 'A data de check-out deve ser posterior à data de check-in.' });
    }


    const reservaData = {
      nome,
      data_nascimento,
      cpf,
      telefone,
      email,
      quarto_id: parseInt(quarto_id, 10),
      num_hospedes: parseInt(num_hospedes, 10),
      data_checkin: checkin,
      data_checkout: checkout,
    };

    const novaReserva = await database.createReserva(reservaData);
    return reply.status(201).send(novaReserva);

  } catch (error) {
    console.error('Erro ao criar reserva:', error);
    if (error.code === '23503') { 
        if (error.constraint && error.constraint.includes('quarto_id')) {
             return reply.status(400).send({ error: 'O quarto selecionado não existe ou não está disponível.' });
        }
    }
    if (error.code === '23505') { 
        if (error.constraint && error.constraint.includes('cpf')) {
            return reply.status(409).send({ error: 'Já existe um cliente com este CPF e ocorreu um erro ao processar.' });
        }
    }
    return reply.status(500).send({ error: 'Erro interno ao processar a sua reserva.' });
  }
});

server.get('/quarto/:id', async (request, reply) => {
  try {
    const quartoId = parseInt(request.params.id, 10);
    if (isNaN(quartoId)) {
      return reply.status(400).send({ error: 'ID do quarto inválido.' });
    }

    const quarto = await database.getQuartoById(quartoId);

    if (!quarto) {
      return reply.status(404).send({ error: 'Quarto não encontrado.' });
    }
    return quarto;
  } catch (error) {
    console.error('Erro ao buscar quarto por ID:', error);
    return reply.status(500).send({ error: 'Erro interno ao buscar detalhes do quarto.' });
  }
});

server.listen({
  host: '0.0.0.0',
  port: process.env.PORT || 3332, 
}, (err, address) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(`Servidor rodando em ${address}`)
})