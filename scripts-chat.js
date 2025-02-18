    let replyMode = null; // índice da mensagem em reply
    let selectedMessageIndex = null; // índice da mensagem selecionada
    let selectedMessageData = null; // dados da mensagem selecionada
    let lastMessageCount = 0; // rastreia a quantidade de mensagens exibidas

    // Aguarda o carregamento completo do DOM
    window.onload = function() {
        // Se houver usuário salvo, já exibe o chat e inicia a atualização das mensagens
        const savedUser = localStorage.getItem('chatUser');
        if (savedUser) {
            showChat();
            loadMessages();
            setInterval(loadMessages, 3000);
        }

        // Ajusta o textarea conforme o conteúdo e atualiza o contador de caracteres
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.addEventListener('input', function() {
                autoResize.call(this);
                updateCharCounter();
            });
            // Permite enviar a mensagem com Enter (sem inserir nova linha)
            messageInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                }
            });
        }

        // Esconde o menu flutuante ao clicar em qualquer lugar da página
        document.addEventListener('click',
            function() {
                hideFloatingMenu();
            });
    };

    // Login do usuário
    async function login() {
        const username = document.getElementById('username').value.trim();
        // Atualizado para buscar o valor do input com id "userID"
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

    // Cria um elemento de mensagem com base nos dados
    function createMessageDiv(msg, index, user, animate) {
        const messageDiv = document.createElement('div');
        messageDiv.className = msg.user === user.user ? 'message mine': 'message other';
        // Aplica animação apenas para novas mensagens
        messageDiv.style.animation = animate ? "slideUp 0.5s ease": "none";

        let html = '';
        if (msg.user !== user.user) {
            html += `<div class="message-user">${msg.user}</div>`;
        }
        html += `<div class="message-content">${msg.msg}</div>`;
        messageDiv.innerHTML = html;

        // Adiciona o evento para exibir o menu flutuante
        messageDiv.addEventListener('click', function(event) {
            event.stopPropagation();
            showFloatingMenu(event, index, msg);
        });

        // Renderiza os replies (se existirem)
        if (msg.replies && msg.replies.length > 0) {
            const repliesContainer = document.createElement('div');
            repliesContainer.className = 'replies-container';
            msg.replies.forEach(reply => {
                const replyDiv = document.createElement('div');
                replyDiv.className = 'reply';
                replyDiv.innerHTML = `<div class="reply-user">${reply.user}</div><div class="reply-content">${reply.replyMsg}</div>`;
                repliesContainer.appendChild(replyDiv);
            });
            messageDiv.appendChild(repliesContainer);
        }
        return messageDiv;
    }

    // Carrega e renderiza as mensagens
    async function loadMessages() {
        try {
            const response = await fetch('https://spiny-cliff-leather.glitch.me/api/show-global-msgs');
            if (response.ok) {
                const messages = await response.json();
                const messagesContainer = document.getElementById('messages');
                const user = JSON.parse(localStorage.getItem('chatUser'));

                // Se houver deleção ou modificação (quantidade menor), re-renderiza tudo sem animação
                if (messages.length < messagesContainer.children.length) {
                    messagesContainer.innerHTML = '';
                    messages.forEach((msg, index) => {
                        const messageDiv = createMessageDiv(msg, index, user, false);
                        messagesContainer.appendChild(messageDiv);
                    });
                }
                // Se novas mensagens foram adicionadas, insere apenas as novas com animação
                else if (messages.length > messagesContainer.children.length) {
                    for (let index = messagesContainer.children.length; index < messages.length; index++) {
                        const msg = messages[index];
                        const messageDiv = createMessageDiv(msg, index, user, true);
                        messagesContainer.appendChild(messageDiv);
                    }
                }
                // Se a quantidade for a mesma, atualiza o conteúdo se houver alterações
                else {
                    for (let index = 0; index < messages.length; index++) {
                        const msg = messages[index];
                        const currentDiv = messagesContainer.children[index];
                        const currentReplyCount = currentDiv.querySelector('.replies-container') ? currentDiv.querySelectorAll('.reply').length: 0;
                        const newReplyCount = msg.replies ? msg.replies.length: 0;
                        if (currentDiv && (currentDiv.querySelector('.message-content').textContent !== msg.msg || currentReplyCount !== newReplyCount)) {
                            const newDiv = createMessageDiv(msg, index, user, false);
                            messagesContainer.replaceChild(newDiv, currentDiv);
                        }
                    }
                }
                lastMessageCount = messages.length;
            } else {
                alert('Erro ao carregar mensagens');
            }
        } catch (error) {
            console.error('Erro ao carregar mensagens:', error);
        }
    }

    // Rola o container de mensagens até o final
    function scrollToBottom() {
        const messagesContainer = document.getElementById('messages');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Exibe o menu flutuante próximo à mensagem clicada
    function showFloatingMenu(event, msgIndex, msg) {
        selectedMessageIndex = msgIndex;
        selectedMessageData = msg;
        const menu = document.getElementById('floatingMenu');
        const user = JSON.parse(localStorage.getItem('chatUser'));
        // Exibe a opção de apagar somente se o id da mensagem for o mesmo do usuário logado
        const deleteOption = document.getElementById('deleteOption');
        if (deleteOption) {
            deleteOption.style.display = (msg.id === user.id) ? 'block': 'none';
        }
        menu.style.left = "-9999px";
        menu.style.top = "-9999px";
        menu.style.display = 'block';

        const menuWidth = menu.offsetWidth;
        const menuHeight = menu.offsetHeight;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        let posX = event.pageX;
        let posY = event.pageY;

        posX = Math.min(Math.max(10, posX), windowWidth - menuWidth - 10);
        posY = Math.min(Math.max(10, posY), windowHeight - menuHeight - 10);

        menu.style.left = posX + "px";
        menu.style.top = posY + "px";
    }

    // Esconde o menu flutuante
    function hideFloatingMenu() {
        document.getElementById('floatingMenu').style.display = 'none';
    }

    // Inicia o modo reply
    function replySelected() {
        startReply(selectedMessageIndex, selectedMessageData.user);
        hideFloatingMenu();
    }

    // Apaga a mensagem selecionada
    function deleteSelected() {
        deleteMessage(selectedMessageIndex);
        hideFloatingMenu();
    }

    // Exibe as informações do usuário da mensagem selecionada
    async function showUserInfoSelected() {
        const identifier = selectedMessageData.id || selectedMessageData.user;
        openSearchModal();
        document.getElementById('searchInput').value = identifier;
        await fetchAndShowUserProfile(identifier);
        hideFloatingMenu();
    }

    // Inicia o modo reply para a mensagem selecionada
    function startReply(msgIndex, username) {
        replyMode = msgIndex;
        document.getElementById('replyBanner').style.display = 'flex';
        document.getElementById('replyInfo').textContent = `Respondendo a: ${username}`;
        document.getElementById('messageInput').focus();
    }

    // Cancela o modo reply
    function cancelReply() {
        replyMode = null;
        document.getElementById('replyBanner').style.display = 'none';
    }

    // Envia uma mensagem (ou reply, se o modo estiver ativo)
    async function sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const message = messageInput.value.trim();
        if (!message) return;
        const user = JSON.parse(localStorage.getItem('chatUser'));
        try {
            let response;
            if (replyMode !== null) {
                response = await fetch(`https://spiny-cliff-leather.glitch.me/api/reply-to-msg?id=${encodeURIComponent(user.id)}&msgIndex=${replyMode}&replyMsg=${encodeURIComponent(message)}`, {
                    method: 'POST'
                });
                cancelReply();
            } else {
                response = await fetch(`https://spiny-cliff-leather.glitch.me/api/name?Nome=${encodeURIComponent(user.user)}&id=${encodeURIComponent(user.id)}&msg=${encodeURIComponent(message)}`);
            }
            if (response.ok) {
                messageInput.value = '';
                autoResize.call(messageInput);
                updateCharCounter();
                await loadMessages();
                scrollToBottom();
            } else {
                alert('Erro ao enviar mensagem');
            }
        } catch (error) {
            alert('Erro ao enviar mensagem');
            console.error(error);
        }
    }

    // Deleta a mensagem selecionada
    async function deleteMessage(msgIndex) {
        const user = JSON.parse(localStorage.getItem('chatUser'));
        try {
            const response = await fetch(`https://spiny-cliff-leather.glitch.me/api/delete-msg?id=${encodeURIComponent(user.id)}&msgIndex=${msgIndex}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                loadMessages();
            } else {
                alert(await response.text());
            }
        } catch (error) {
            alert('Erro ao apagar mensagem');
            console.error(error);
        }
    }

    // Ajusta a altura do textarea conforme o conteúdo
    function autoResize() {
        this.style.height = 'auto';
        const newHeight = this.scrollHeight;
        const maxHeight = 150;
        if (newHeight > maxHeight) {
            this.style.height = maxHeight + 'px';
            this.style.overflowY = 'auto';
        } else {
            this.style.height = newHeight + 'px';
            this.style.overflowY = 'hidden';
        }
    }

    // Atualiza o contador de caracteres
    function updateCharCounter() {
        const messageInput = document.getElementById('messageInput');
        const counter = document.getElementById('charCounter');
        counter.textContent = `${messageInput.value.length} / 1500`;
    }

    // Abre o modal de pesquisa de usuário
    function openSearchModal() {
        document.getElementById('searchModal').style.display = 'flex';
    }

    // Fecha o modal de pesquisa e limpa os campos
    function closeSearchModal() {
        document.getElementById('searchModal').style.display = 'none';
        document.getElementById('userProfile').innerHTML = '';
        document.getElementById('searchInput').value = '';
    }

    // Pesquisa o perfil do usuário usando o valor do input
    async function searchUser() {
        const searchValue = document.getElementById('searchInput').value.trim();
        if (!searchValue) return;
        await fetchAndShowUserProfile(searchValue);
    }

    // Busca e exibe o perfil do usuário
    async function fetchAndShowUserProfile(identifier) {
        try {
            const response = await fetch(`https://spiny-cliff-leather.glitch.me/api/user-profile/${encodeURIComponent(identifier)}`);
            if (response.ok) {
                const profile = await response.json();
                document.getElementById('userProfile').innerHTML =
                `<strong>${profile.user}</strong><br>ID: ${profile.id}<br>Total Mensagens: ${profile.totalMessages}<br>Total Respostas: ${profile.totalReplies}`;
            } else {
                document.getElementById('userProfile').textContent = 'Usuário não encontrado';
            }
        } catch (error) {
            console.error('Erro na pesquisa:', error);
            document.getElementById('userProfile').textContent = 'Erro ao buscar informações';
        }
    }