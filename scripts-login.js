// Login do usuário
async function login() {
    const username = document.getElementById('username').value.trim();
    const userID = document.getElementById('gmail').value.trim();
    if (username.length < 3) {
        alert('O nome deve ter no mínimo 3 caracteres!');
        return;
    }
    if (!username || !userID) {
        alert('Preencha todos os campos!');
        return;
    }
    try {
        const response = await fetch(`https://spiny-cliff-leather.glitch.me/api/user?user_name=${encodeURIComponent(username)}&gmail=${encodeURIComponent(userID)}`);
        if (response.ok) {
            localStorage.setItem('chatUser', JSON.stringify({
                user: username, id: userID
            }));
            showChat();
            loadMessages();
            setInterval(loadMessages, 3000);
        } else {
            alert(await response.text());
        }
    } catch (error) {
        alert('Erro ao conectar ao servidor');
        console.error(error);
    }
}

// Exibe a tela do chat
function showChat() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('chatScreen').style.display = 'flex';
}