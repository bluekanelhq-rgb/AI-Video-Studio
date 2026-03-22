import { query } from './db';

async function seed() {
  try {
    console.log('Seeding database...');

    // Create a demo user
    const userResult = await query(
      `INSERT INTO users (email, password_hash, name)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      ['demo@example.com', 'demo_hash', 'Demo User']
    );

    if (userResult.rows.length > 0) {
      console.log('Demo user created with ID:', userResult.rows[0].id);
    } else {
      console.log('Demo user already exists');
    }

    console.log('Seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
