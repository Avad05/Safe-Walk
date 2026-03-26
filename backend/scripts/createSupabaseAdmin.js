import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcrypt';
import { supabase } from '../config/supabase.js';

const createAdmin = async () => {
  try {
    console.log('Creating admin user...');

    // Check if operator already exists
    const { data: existingUsers } = await supabase
      .from('users')
      .select('*')
      .eq('username', 'operator');
    
    if (existingUsers && existingUsers.length > 0) {
      console.log('✅ Operator user already exists');
      
      // Update password
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const { error } = await supabase
        .from('users')
        .update({ password: hashedPassword })
        .eq('username', 'operator');
      
      if (error) {
        console.error('Error updating password:', error);
      } else {
        console.log('✅ Password updated');
      }
      
      process.exit(0);
    }

    // Create operator user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          username: 'operator',
          password: hashedPassword,
          role: 'operator'
        }
      ])
      .select();

    if (error) {
      console.error('❌ Error creating user:', error);
      process.exit(1);
    }

    console.log('✅ Operator user created successfully');
    console.log('Username: operator');
    console.log('Password: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

createAdmin();