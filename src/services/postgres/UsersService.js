const { nanoid } = require("nanoid");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const InvariantError = require("../../exceptions/InvariantError");
const AuthenticationError = require("../../exceptions/AuthenticationError");

class UsersService {
  constructor() {
    this._pool = new Pool();
  }

  async verifyUserCredential(username, password) {
    const query = {
      text: "SELECT id, username, password FROM users WHERE username = $1",
      values: [username],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new AuthenticationError("Kredensial yang Anda berikan salah");
    }

    const { id, password: hashedPassword } = result.rows[0];

    const match = await bcrypt.compare(password, hashedPassword);

    if (!match) {
      throw new AuthenticationError("Kredensial yang Anda berikan salah");
    }

    return id;
  }

  async addUser({ username, password, fullname }) {
    await this.verifyNewUsername(username);
    const id = `user-${nanoid(16)}`;
    const hashPassword = await bcrypt.hash(password, 10);

    const query = {
      text: "INSERT INTO users VALUES($1, $2, $3, $4) RETURNING id, username, fullname",
      values: [id, username, hashPassword, fullname],
    };

    return this._pool.query(query).then((result) => {
      if (!result.rows.length) {
        throw new InvariantError("User gagal ditambahkan");
      }

      return result.rows[0].id;
    });
  }

  async getUserById(userId) {
    const query = {
      text: "SELECT id, username, fullname FROM users WHERE id = $1",
      values: [userId],
    };

    return this._pool.query(query).then((result) => {
      if (!result.rows.length) {
        throw new InvariantError("User tidak ditemukan");
      }

      return result.rows[0];
    });
  }

  async getUserByUsername(username) {
    const query = {
      text: "SELECT id, username, password, fullname FROM users WHERE username LIKE $1",
      values: [`%${username}%`],
    };

    const result = await this._pool.query(query);
    return result.rows;
  }

  async verifyNewUsername(username) {
    const query = {
      text: "SELECT username FROM users WHERE username = $1",
      values: [username],
    };

    const result = await this._pool.query(query);
    if (result.rows.length > 0) {
      throw new InvariantError(
        "Gagal menambahkan user. Username sudah digunakan."
      );
    }
  }
}

module.exports = UsersService;
