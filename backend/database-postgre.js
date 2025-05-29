import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export class DatabasePostgres {
  async list(filters = {}) {
    const { hotel, tipo, capacidade } = filters;
    let query = `
      SELECT 
        q.quarto_id,
        q.num_quarto,
        q.tipo,
        q.preco_noite,
        q.disponivel,
        q.tamanho,
        q.tipo_cama,
        q.num_hospedes,
        h.nome AS hotel
      FROM quarto q
      JOIN hotel h ON q.hotel_id = h.hotel_id
      WHERE q.disponivel = true
    `;

    const params = [];
    let paramIndex = 1;

    if (hotel && hotel !== 'Selecione o Hotel') {
      query += ` AND h.nome = $${paramIndex}`;
      params.push(hotel);
      paramIndex++;
    }

    if (tipo && tipo !== 'Selecione o Quarto') {
      query += ` AND q.tipo = $${paramIndex}`;
      params.push(tipo);
      paramIndex++;
    }

    if (capacidade && capacidade !== '1 Hóspede') {
      const minCapacidade = capacidade === '4+ Hóspedes' ? 4 : parseInt(capacidade);
      query += ` AND q.num_hospedes >= $${paramIndex}`;
    }

    console.log('Executando query (list):', query, params);
    const result = await pool.query(query, params);
    return result.rows;
  }

  async createReserva(reservaData) {
    const {
      nome,
      data_nascimento,
      cpf,
      telefone,
      email,
      quarto_id,
      num_hospedes,
      data_checkin,
      data_checkout,
    } = reservaData;

    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      let clienteId;
      const { rows: existingClients } = await client.query(
        'SELECT cliente_id FROM cliente WHERE cpf = $1',
        [cpf]
      );

      if (existingClients.length > 0) {
        clienteId = existingClients[0].cliente_id;
      } else {
        const defaultPassword = 'defaultpassword123';
        const { rows: newClient } = await client.query(
          `INSERT INTO cliente (nome, telefone, email, cpf, senha, data_nascimento)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING cliente_id`,
          [nome, telefone, email, cpf, defaultPassword, data_nascimento]
        );
        clienteId = newClient[0].cliente_id;
      }

      const { rows: quartoAtual } = await client.query(
        'SELECT disponivel FROM quarto WHERE quarto_id = $1 FOR UPDATE',
        [quarto_id]
      );
      if (quartoAtual.length === 0 || !quartoAtual[0].disponivel) {
        throw new Error('Quarto não está disponível ou não existe.');
      }

      const { rows: quartoDetails } = await client.query(
        'SELECT preco_noite FROM quarto WHERE quarto_id = $1',
        [quarto_id]
      );

      if (quartoDetails.length === 0) {
        throw new Error('Quarto não encontrado para cálculo do subtotal.');
      }
      const precoNoite = parseFloat(quartoDetails[0].preco_noite);

      if (isNaN(precoNoite) || precoNoite < 0) {
        throw new Error('Preço por noite inválido para o quarto selecionado.');
      }

      const dataCheckinObj = new Date(data_checkin);
      const dataCheckoutObj = new Date(data_checkout);
      let subtotalReserva = 0;

      if (dataCheckoutObj > dataCheckinObj) {
        const diffTime = Math.abs(dataCheckoutObj - dataCheckinObj);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 0) {
          throw new Error('A reserva deve ser para pelo menos 1 noite.');
        }
        subtotalReserva = diffDays * precoNoite;
      } else {
        throw new Error('Data de check-out deve ser posterior à data de check-in.');
      }

      const dataReserva = new Date();
      const statusReserva = 'Confirmada';

      const { rows: newReserva } = await client.query(
        `INSERT INTO reserva (cliente_id, quarto_id, data_checkin, data_checkout, data_reserva, status, num_hospedes, subtotal)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [clienteId, quarto_id, data_checkin, data_checkout, dataReserva, statusReserva, num_hospedes, subtotalReserva.toFixed(2)]
      );

      await client.query(
        'UPDATE quarto SET disponivel = FALSE WHERE quarto_id = $1',
        [quarto_id]
      );

      await client.query('COMMIT');
      console.log("Reserva criada e quarto atualizado para indisponível:", newReserva[0]);
      return newReserva[0];

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Erro na transação da reserva (createReserva):', error.message, error.detail, error.stack);
      throw error;
    } finally {
      client.release();
    }
  }

  async getQuartoById(id) {
    const query = `
    SELECT 
      q.quarto_id AS id,
      q.num_quarto,
      q.tipo,
      q.preco_noite,
      q.disponivel,
      q.tamanho,
      q.tipo_cama,
      q.num_hospedes AS capacidade, -- Capacidade do quarto
      h.nome AS hotel_nome,
      h.hotel_id -- Adicionado para referência, se necessário
    FROM quarto q
    JOIN hotel h ON q.hotel_id = h.hotel_id
    WHERE q.quarto_id = $1;
  `;
    console.log('Executando query (getQuartoById):', query, [id]);
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

}