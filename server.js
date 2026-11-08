const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Подключение к вашей базе данных Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Начисление монет за нахождение на сайте (+5 монет)
app.post('/api/add-coins', async (req, res) => {
    const { telegram_id, username } = req.body;
    if (!telegram_id) return res.status(400).json({ error: 'Missing ID' });

    // Проверяем, есть ли уже такой пользователь в базе, или создаем его
    let { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', telegram_id)
        .single();

    if (!user) {
        const { data: newUser } = await supabase
            .from('users')
            .insert([{ telegram_id, username, coins: 5 }])
            .select().single();
        return res.json(newUser);
    }

    // Если есть, просто добавляем 5 монет к балансу
    const { data: updatedUser } = await supabase
        .from('users')
        .update({ coins: user.coins + 5, username: username })
        .eq('telegram_id', telegram_id)
        .select().single();

    res.json(updatedUser);
});

// Получение списка ТОП-5 игроков по балансу монет
app.get('/api/leaderboard', async (req, res) => {
    const { data: topUsers, error } = await supabase
        .from('users')
        .select('username, coins')
        .order('coins', { ascending: false })
        .limit(5);

    res.json(topUsers || []);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
