// Dados globais
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let goals = JSON.parse(localStorage.getItem('goals')) || {};
let selectedOverviewMonth = null; // null = mês atual
let isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

// Credenciais de demonstração
const DEMO_CREDENTIALS = {
    username: 'edy.s',
    password: 'Jesus1105'
};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    
    // Setup do formulário de login
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Setup inicial do botão de logout
    setupLogoutButton();
    
    // Setup do dashboard (só se estiver logado)
    if (isLoggedIn) {
        initializeDashboard();
    }
});

// Configurar botão de logout
function setupLogoutButton() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
}

// Verificar status de autenticação
function checkAuthStatus() {
    if (isLoggedIn) {
        showDashboard();
    } else {
        showLogin();
    }
}

// Mostrar tela de login
function showLogin() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('dashboardScreen').style.display = 'none';
}

// Mostrar dashboard
function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboardScreen').style.display = 'block';
    
    if (isLoggedIn) {
        initializeDashboard();
    }
}

// Inicializar dashboard
function initializeDashboard() {
    document.getElementById('date').valueAsDate = new Date();
    updateOverviewMonthFilter();
    updateOverview();
    renderTransactions();
    updateFilters();
    updateGoalsDisplay();
}

// Processar login
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Validar credenciais
    if (username === DEMO_CREDENTIALS.username && password === DEMO_CREDENTIALS.password) {
        // Login bem-sucedido
        isLoggedIn = true;
        localStorage.setItem('isLoggedIn', 'true');
        
        // Limpar formulário
        document.getElementById('loginForm').reset();
        
        // Mostrar dashboard
        showDashboard();
        
        // Mostrar mensagem de sucesso
        setTimeout(() => {
            alert('✅ Login realizado com sucesso! Bem-vindo ao Dashboard Financeiro!');
        }, 100);
        
    } else {
        // Login falhou
        alert('❌ Credenciais inválidas! Verifique seu usuário e senha.');
        
        // Limpar apenas a senha
        document.getElementById('password').value = '';
        document.getElementById('password').focus();
    }
}

// Logout simples e direto
function logout() {
    if (confirm('🚪 Deseja sair do sistema?')) {
        // Limpar dados da sessão
        isLoggedIn = false;
        localStorage.removeItem('isLoggedIn');
        
        // Limpar dados temporários
        selectedOverviewMonth = null;
        
        // Limpar formulário de login
        document.getElementById('loginForm').reset();
        
        // Voltar para tela de login
        showLogin();
        
        // Focar no campo de usuário
        document.getElementById('username').focus();
    }
}

// Navegação entre abas
function showTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tabName).classList.add('active');
    
    if (tabName === 'overview') {
        updateOverview();
    } else if (tabName === 'reports') {
        updateReports();
    }
}

// Atualizar filtro de mês da visão geral
function updateOverviewMonthFilter() {
    const months = [...new Set(transactions.map(t => t.month))].sort().reverse();
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    const overviewMonthFilter = document.getElementById('overviewMonthFilter');
    overviewMonthFilter.innerHTML = '<option value="">Mês Atual</option>' +
        months.map(m => `<option value="${m}">${new Date(m + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</option>`).join('');
    
    // Se não há mês selecionado, usar o atual
    if (!selectedOverviewMonth) {
        selectedOverviewMonth = currentMonth;
    }
}

// Event listener para filtro de mês da visão geral
document.getElementById('overviewMonthFilter').addEventListener('change', function() {
    const value = this.value;
    selectedOverviewMonth = value || new Date().toISOString().slice(0, 7);
    updateOverview();
});

// Resetar filtro para mês atual
function resetOverviewFilter() {
    selectedOverviewMonth = new Date().toISOString().slice(0, 7);
    document.getElementById('overviewMonthFilter').value = '';
    updateOverview();
}

// Formulário de transações
document.getElementById('transactionForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const transaction = {
        id: Date.now(),
        date: document.getElementById('date').value,
        type: document.getElementById('type').value,
        category: document.getElementById('category').value,
        amount: parseFloat(document.getElementById('amount').value),
        paymentMethod: document.getElementById('paymentMethod').value,
        description: document.getElementById('description').value,
        month: new Date(document.getElementById('date').value).toISOString().slice(0, 7)
    };
    
    transactions.push(transaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    
    this.reset();
    document.getElementById('date').valueAsDate = new Date();
    
    renderTransactions();
    updateOverviewMonthFilter();
    updateOverview();
    updateFilters();
    
    alert('✅ Lançamento adicionado com sucesso!');
});

// Renderizar tabela de transações
function renderTransactions() {
    const tbody = document.querySelector('#transactionsTable tbody');
    const filterMonth = document.getElementById('filterMonth').value;
    const filterType = document.getElementById('filterType').value;
    const filterCategory = document.getElementById('filterCategory').value;
    
    let filteredTransactions = transactions.filter(t => {
        return (!filterMonth || t.month === filterMonth) &&
               (!filterType || t.type === filterType) &&
               (!filterCategory || t.category === filterCategory);
    });
    
    tbody.innerHTML = filteredTransactions.map(t => `
        <tr>
            <td>${new Date(t.date).toLocaleDateString('pt-BR')}</td>
            <td>${getTypeIcon(t.type)} ${getTypeName(t.type)}</td>
            <td>${getCategoryIcon(t.category)} ${getCategoryName(t.category)}</td>
            <td>${t.description}</td>
            <td class="${t.type === 'income' ? 'positive' : 'negative'}">
                ${formatCurrency(t.amount)}
            </td>
            <td>${getPaymentIcon(t.paymentMethod)} ${getPaymentName(t.paymentMethod)}</td>
            <td>
                <button class="delete-btn" onclick="deleteTransaction(${t.id})">🗑️</button>
            </td>
        </tr>
    `).join('');
}

// Deletar transação
function deleteTransaction(id) {
    if (confirm('Tem certeza que deseja excluir este lançamento?')) {
        transactions = transactions.filter(t => t.id !== id);
        localStorage.setItem('transactions', JSON.stringify(transactions));
        renderTransactions();
        updateOverviewMonthFilter();
        updateOverview();
        updateFilters();
    }
}

// Atualizar visão geral
function updateOverview() {
    const targetMonth = selectedOverviewMonth || new Date().toISOString().slice(0, 7);
    const monthlyTransactions = transactions.filter(t => t.month === targetMonth);
    
    // Atualizar indicador do mês
    const monthIndicator = document.getElementById('currentMonthIndicator');
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    if (targetMonth === currentMonth) {
        monthIndicator.textContent = '📅 Mês Atual - ' + new Date(targetMonth + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        monthIndicator.style.background = '#2eaadc';
    } else {
        monthIndicator.textContent = '📅 ' + new Date(targetMonth + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        monthIndicator.style.background = '#6b7280';
    }
    
    const totalIncome = monthlyTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = monthlyTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalInvestments = monthlyTransactions
        .filter(t => t.type === 'investment')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const finalBalance = totalIncome - totalExpenses - totalInvestments;
    
    document.getElementById('totalIncome').textContent = formatCurrency(totalIncome);
    document.getElementById('totalExpenses').textContent = formatCurrency(totalExpenses);
    document.getElementById('totalInvestments').textContent = formatCurrency(totalInvestments);
    document.getElementById('finalBalance').textContent = formatCurrency(finalBalance);
    document.getElementById('finalBalance').className = `value ${finalBalance >= 0 ? 'positive' : 'negative'}`;
    
    updateExpenseComparison(targetMonth, totalExpenses);
    updateCategoryBreakdown(monthlyTransactions);
    updateMonthlyComparison(targetMonth);
    updateMonthlyChart();
}

// Atualizar comparação de despesas
function updateExpenseComparison(targetMonth, currentExpenses) {
    const targetDate = new Date(targetMonth + '-01');
    const previousMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() - 1, 1)
        .toISOString().slice(0, 7);
    
    const previousExpenses = transactions
        .filter(t => t.month === previousMonth && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const comparisonDiv = document.getElementById('expenseComparison');
    
    if (previousExpenses > 0) {
        const difference = currentExpenses - previousExpenses;
        const percentChange = ((difference / previousExpenses) * 100).toFixed(1);
        
        if (difference > 0) {
            comparisonDiv.innerHTML = `📈 +${formatCurrency(Math.abs(difference))} (+${percentChange}%) vs mês anterior`;
            comparisonDiv.style.color = '#e03e3e';
        } else if (difference < 0) {
            comparisonDiv.innerHTML = `📉 -${formatCurrency(Math.abs(difference))} (${percentChange}%) vs mês anterior`;
            comparisonDiv.style.color = '#0f7b0f';
        } else {
            comparisonDiv.innerHTML = `➡️ Mesmo valor do mês anterior`;
            comparisonDiv.style.color = '#6b7280';
        }
    } else {
        comparisonDiv.innerHTML = `🆕 Primeiro mês com dados`;
        comparisonDiv.style.color = '#6b7280';
    }
}

// Atualizar comparativo mensal detalhado
function updateMonthlyComparison(targetMonth) {
    const monthlyData = {};
    
    // Agrupar despesas por mês
    transactions.filter(t => t.type === 'expense').forEach(t => {
        if (!monthlyData[t.month]) {
            monthlyData[t.month] = 0;
        }
        monthlyData[t.month] += t.amount;
    });
    
    const months = Object.keys(monthlyData).sort();
    const comparisonDiv = document.getElementById('monthlyComparison');
    
    if (months.length === 0) {
        comparisonDiv.innerHTML = '<p>Nenhuma despesa registrada ainda.</p>';
        return;
    }
    
    // Criar tabela comparativa
    let html = `
        <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #f7f6f3;">
                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e1e1e0;">📅 Mês</th>
                        <th style="padding: 12px; text-align: right; border-bottom: 1px solid #e1e1e0;">💸 Despesas</th>
                        <th style="padding: 12px; text-align: right; border-bottom: 1px solid #e1e1e0;">📊 Variação</th>
                        <th style="padding: 12px; text-align: center; border-bottom: 1px solid #e1e1e0;">📈 Tendência</th>
                    </tr>
                </thead>
                <tbody>
        `;
    
    months.forEach((month, index) => {
        const amount = monthlyData[month];
        const isCurrentMonth = month === targetMonth;
        let variation = '';
        let trend = '';
        
        if (index > 0) {
            const previousAmount = monthlyData[months[index - 1]];
            const difference = amount - previousAmount;
            const percentChange = ((difference / previousAmount) * 100).toFixed(1);
            
            if (difference > 0) {
                variation = `<span style="color: #e03e3e;">+${formatCurrency(Math.abs(difference))} (+${percentChange}%)</span>`;
                trend = '<span style="color: #e03e3e;">📈</span>';
            } else if (difference < 0) {
                variation = `<span style="color: #0f7b0f;">-${formatCurrency(Math.abs(difference))} (${percentChange}%)</span>`;
                trend = '<span style="color: #0f7b0f;">📉</span>';
            } else {
                variation = '<span style="color: #6b7280;">Sem variação</span>';
                trend = '<span style="color: #6b7280;">➡️</span>';
            }
        } else {
            variation = '<span style="color: #6b7280;">-</span>';
            trend = '<span style="color: #6b7280;">🆕</span>';
        }
        
        const monthName = new Date(month + '-01').toLocaleDateString('pt-BR', { 
            month: 'long', 
            year: 'numeric' 
        });
        
        html += `
            <tr style="${isCurrentMonth ? 'background: #e8f4f8; font-weight: 600;' : ''}">
                <td style="padding: 12px; border-bottom: 1px solid #f1f1ef;">
                    ${isCurrentMonth ? '👉 ' : ''}${monthName}
                </td>
                <td style="padding: 12px; text-align: right; border-bottom: 1px solid #f1f1ef;">
                    ${formatCurrency(amount)}
                </td>
                <td style="padding: 12px; text-align: right; border-bottom: 1px solid #f1f1ef;">
                    ${variation}
                </td>
                <td style="padding: 12px; text-align: center; border-bottom: 1px solid #f1f1ef;">
                    ${trend}
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    // Adicionar resumo estatístico
    const amounts = Object.values(monthlyData);
    const average = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
    const highest = Math.max(...amounts);
    const lowest = Math.min(...amounts);
    
    html += `
        <div style="margin-top: 20px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
                <div style="font-size: 12px; color: #6b7280; margin-bottom: 5px;">📊 Média Mensal</div>
                <div style="font-size: 18px; font-weight: 600;">${formatCurrency(average)}</div>
            </div>
            <div style="background: #fef3cd; padding: 15px; border-radius: 8px; text-align: center;">
                <div style="font-size: 12px; color: #6b7280; margin-bottom: 5px;">📈 Maior Gasto</div>
                <div style="font-size: 18px; font-weight: 600; color: #e03e3e;">${formatCurrency(highest)}</div>
            </div>
            <div style="background: #d1edff; padding: 15px; border-radius: 8px; text-align: center;">
                <div style="font-size: 12px; color: #6b7280; margin-bottom: 5px;">📉 Menor Gasto</div>
                <div style="font-size: 18px; font-weight: 600; color: #0f7b0f;">${formatCurrency(lowest)}</div>
            </div>
        </div>
    `;
    
    comparisonDiv.innerHTML = html;
}

// Atualizar breakdown por categoria
function updateCategoryBreakdown(monthlyTransactions) {
    const categoryTotals = {};
    
    monthlyTransactions.forEach(t => {
        if (t.type === 'expense') {
            categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
        }
    });
    
    const breakdown = document.getElementById('categoryBreakdown');
    breakdown.innerHTML = Object.entries(categoryTotals)
        .sort(([,a], [,b]) => b - a)
        .map(([category, amount]) => `
            <div class="metric">
                <span>${getCategoryIcon(category)} ${getCategoryName(category)}</span>
                <span class="metric-value negative">${formatCurrency(amount)}</span>
            </div>
        `).join('') || '<p>Nenhuma despesa registrada neste mês.</p>';
}

// Atualizar gráfico mensal
function updateMonthlyChart() {
    const ctx = document.getElementById('monthlyChart').getContext('2d');
    
    // Limpar gráfico anterior
    if (window.monthlyChartInstance) {
        window.monthlyChartInstance.destroy();
    }
    
    // Agrupar por mês
    const monthlyData = {};
    transactions.forEach(t => {
        if (!monthlyData[t.month]) {
            monthlyData[t.month] = { income: 0, expenses: 0 };
        }
        if (t.type === 'income') {
            monthlyData[t.month].income += t.amount;
        } else if (t.type === 'expense') {
            monthlyData[t.month].expenses += t.amount;
        }
    });
    
    const months = Object.keys(monthlyData).sort();
    const incomeData = months.map(m => monthlyData[m].income);
    const expenseData = months.map(m => monthlyData[m].expenses);
    
    window.monthlyChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months.map(m => new Date(m + '-01').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })),
            datasets: [{
                label: 'Entradas',
                data: incomeData,
                borderColor: '#0f7b0f',
                backgroundColor: 'rgba(15, 123, 15, 0.1)',
                tension: 0.4
            }, {
                label: 'Despesas',
                data: expenseData,
                borderColor: '#e03e3e',
                backgroundColor: 'rgba(224, 62, 62, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'R$ ' + value.toLocaleString('pt-BR');
                        }
                    }
                }
            }
        }
    });
}

// Atualizar relatórios
function updateReports() {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    
    // Limpar gráfico anterior
    if (window.categoryChartInstance) {
        window.categoryChartInstance.destroy();
    }
    
    const categoryTotals = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });
    
    const categories = Object.keys(categoryTotals);
    const amounts = Object.values(categoryTotals);
    
    window.categoryChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories.map(c => getCategoryName(c)),
            datasets: [{
                data: amounts,
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                    '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF',
                    '#4BC0C0', '#FF6384'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Atualizar filtros
function updateFilters() {
    const months = [...new Set(transactions.map(t => t.month))].sort();
    const categories = [...new Set(transactions.map(t => t.category))];
    
    const monthFilter = document.getElementById('filterMonth');
    const categoryFilter = document.getElementById('filterCategory');
    
    monthFilter.innerHTML = '<option value="">Todos os meses</option>' +
        months.map(m => `<option value="${m}">${new Date(m + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</option>`).join('');
    
    categoryFilter.innerHTML = '<option value="">Todas as categorias</option>' +
        categories.map(c => `<option value="${c}">${getCategoryName(c)}</option>`).join('');
}

// Event listeners para filtros
document.getElementById('filterMonth').addEventListener('change', renderTransactions);
document.getElementById('filterType').addEventListener('change', renderTransactions);
document.getElementById('filterCategory').addEventListener('change', renderTransactions);

// Metas
function setGoals() {
    goals.savings = parseFloat(document.getElementById('savingsGoal').value) || 0;
    goals.expenseLimit = parseFloat(document.getElementById('expenseLimit').value) || 0;
    
    localStorage.setItem('goals', JSON.stringify(goals));
    updateGoalsDisplay();
    alert('✅ Metas salvas com sucesso!');
}

function updateGoalsDisplay() {
    const targetMonth = selectedOverviewMonth || new Date().toISOString().slice(0, 7);
    const monthlyTransactions = transactions.filter(t => t.month === targetMonth);
    
    const totalIncome = monthlyTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = monthlyTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const currentSavings = totalIncome - totalExpenses;
    
    const progressDiv = document.getElementById('goalsProgress');
    
    if (goals.savings || goals.expenseLimit) {
        let html = '';
        
        if (goals.savings) {
            const savingsProgress = Math.min((currentSavings / goals.savings) * 100, 100);
            html += `
                <div class="metric">
                    <span>💰 Meta de Economia</span>
                    <span>${formatCurrency(currentSavings)} / ${formatCurrency(goals.savings)}</span>
                </div>
                <div style="background: #f1f1ef; border-radius: 10px; height: 20px; margin: 10px 0;">
                    <div style="background: ${savingsProgress >= 100 ? '#0f7b0f' : '#2eaadc'}; height: 100%; border-radius: 10px; width: ${savingsProgress}%; transition: width 0.3s;"></div>
                </div>
            `;
        }
        
        if (goals.expenseLimit) {
            const expenseProgress = Math.min((totalExpenses / goals.expenseLimit) * 100, 100);
            html += `
                <div class="metric">
                    <span>💸 Limite de Gastos</span>
                    <span>${formatCurrency(totalExpenses)} / ${formatCurrency(goals.expenseLimit)}</span>
                </div>
                <div style="background: #f1f1ef; border-radius: 10px; height: 20px; margin: 10px 0;">
                    <div style="background: ${expenseProgress >= 100 ? '#e03e3e' : '#2eaadc'}; height: 100%; border-radius: 10px; width: ${expenseProgress}%; transition: width 0.3s;"></div>
                </div>
            `;
        }
        
        progressDiv.innerHTML = html;
    } else {
        progressDiv.innerHTML = '<p>Defina suas metas para acompanhar o progresso!</p>';
    }
}

// Funções auxiliares
function formatCurrency(amount) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(amount);
}

function getTypeIcon(type) {
    const icons = {
        'income': '💰',
        'expense': '💸',
        'investment': '📈'
    };
    return icons[type] || '📦';
}

function getTypeName(type) {
    const names = {
        'income': 'Entrada',
        'expense': 'Despesa',
        'investment': 'Investimento'
    };
    return names[type] || type;
}

function getCategoryIcon(category) {
    const icons = {
        // Receitas
        'salario': '💼',
        'freelance': '💻',
        'investimento': '📊',
        // Despesas Fixas
        'aluguel': '🏠',
        'condominio': '🏢',
        'seguro_carro': '🚗',
        'licenciamento': '📋',
        'curso': '📚',
        'iptu': '🏠',
        'ipva': '🚗',
        'emprestimos': '💳',
        // Despesas Variáveis
        'luz': '💡',
        'agua': '💧',
        'telefone': '📱',
        'gas': '🔥',
        'tv_streaming': '📺',
        'internet': '🌐',
        'uber_taxi': '🚕',
        'combustivel': '⛽',
        'estacionamento': '🅿️',
        'supermercado': '🛒',
        'almoco_trabalho': '🍽️',
        'delivery': '🛵',
        'medicamentos': '💊',
        'barbearia': '✂️',
        'academia': '💪',
        // Despesas Extras
        'medico': '👨‍⚕️',
        'dentista': '🦷',
        'hospital': '🏥',
        'carro_extra': '🔧',
        'casa_extra': '🔨',
        'material_escolar': '📝',
        'uniforme': '👕',
        // Despesas Adicionais
        'viagens': '✈️',
        'cinema_teatro': '🎭',
        'restaurantes_bares': '🍻',
        'roupas': '👔',
        'calcados': '👟',
        'acessorios': '💍',
        'presentes': '🎁',
        'outros': '📦'
    };
    return icons[category] || '📦';
}

function getCategoryName(category) {
    const names = {
        // Receitas
        'salario': 'Salário',
        'freelance': 'Freelance',
        'investimento': 'Investimento',
        // Despesas Fixas
        'aluguel': 'Aluguel',
        'condominio': 'Condomínio',
        'seguro_carro': 'Seguro do Carro',
        'licenciamento': 'Licenciamento',
        'curso': 'Curso',
        'iptu': 'IPTU',
        'ipva': 'IPVA',
        'emprestimos': 'Empréstimos',
        // Despesas Variáveis
        'luz': 'Luz',
        'agua': 'Água',
        'telefone': 'Telefone Celular',
        'gas': 'Gás',
        'tv_streaming': 'TV e Streaming',
        'internet': 'Internet',
        'uber_taxi': 'Uber e Táxi',
        'combustivel': 'Combustível',
        'estacionamento': 'Estacionamento',
        'supermercado': 'Supermercado',
        'almoco_trabalho': 'Almoço Trabalho',
        'delivery': 'Delivery',
        'medicamentos': 'Medicamentos',
        'barbearia': 'Barbearia',
        'academia': 'Academia',
        // Despesas Extras
        'medico': 'Médico',
        'dentista': 'Dentista',
        'hospital': 'Hospital',
        'carro_extra': 'Carro (Manutenção)',
        'casa_extra': 'Casa (Manutenção)',
        'material_escolar': 'Material Escolar',
        'uniforme': 'Uniforme',
        // Despesas Adicionais
        'viagens': 'Viagens',
        'cinema_teatro': 'Cinema/Teatro',
        'restaurantes_bares': 'Restaurantes/Bares',
        'roupas': 'Roupas',
        'calcados': 'Calçados',
        'acessorios': 'Acessórios',
        'presentes': 'Presentes',
        'outros': 'Outros'
    };
    return names[category] || category;
}

function getPaymentIcon(method) {
    const icons = {
        'dinheiro': '💵',
        'debito': '💳',
        'credito': '💳',
        'pix': '📱',
        'transferencia': '🏦'
    };
    return icons[method] || '💳';
}

function getPaymentName(method) {
    const names = {
        'dinheiro': 'Dinheiro',
        'debito': 'Cartão Débito',
        'credito': 'Cartão Crédito',
        'pix': 'PIX',
        'transferencia': 'Transferência'
    };
    return names[method] || method;
}