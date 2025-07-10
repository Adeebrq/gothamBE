import pool from "../config/db.ts";

const TableCreation = async () => {
  try {
    await pool.query(`
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  username TEXT,
  password_hash TEXT,
  profile_pic_url TEXT,
  is_wallet_user BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
`);

    await pool.query(`
    CREATE TABLE IF NOT EXISTS wallets (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  wallet_address TEXT,
  network TEXT
);
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS chatrooms (
  id UUID PRIMARY KEY,
  name TEXT,
  is_paid_room BOOLEAN,
  creator_id UUID REFERENCES users(id),
  default_room BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
`);

    await pool.query(`        
    CREATE TABLE IF NOT EXISTS chatroom_members (
  user_id UUID REFERENCES users(id),
  chatroom_id UUID REFERENCES chatrooms(id),
  is_admin BOOLEAN,
  is_owner BOOLEAN,
  is_blocked BOOLEAN,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, chatroom_id)
);
`);

    await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY,
  chatroom_id UUID REFERENCES chatrooms(id),
  sender_id UUID REFERENCES users(id),
  content TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  deleted BOOLEAN,
  is_file BOOLEAN
);   
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS invite_links (
  id UUID PRIMARY KEY,
  chatroom_id UUID REFERENCES chatrooms(id),
  created_by UUID REFERENCES users(id),
  expires_at TIMESTAMPTZ,
  used_by UUID REFERENCES users(id),
  used_at TIMESTAMPTZ
);
`);

console.log("Tables created successfully if not found")
  } catch (error) {
    console.log("error occured while creating table-", error);
  }
};

export default TableCreation;
