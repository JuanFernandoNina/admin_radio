// Configuración de Supabase
const SUPABASE_URL = 'https://cvzscfcciaegdgnyrkgg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2enNjZmNjaWFlZ2Rnbnlya2dnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3OTQwMjMsImV4cCI6MjA3NjM3MDAyM30.dmAE84YXEtc9667I3b31fehIn_m8-9DIyBGrpppDRMY';

// Verificar que Supabase esté disponible antes de crear el cliente
let supabase;
try {
    if (window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    } else {
        throw new Error('Supabase no está disponible');
    }
} catch (error) {
    console.error('Error inicializando Supabase:', error);
    // Mostrar error en la interfaz
    document.addEventListener('DOMContentLoaded', function() {
        const errorDiv = document.getElementById('loginError');
        if (errorDiv) {
            errorDiv.textContent = 'Error de configuración: ' + error.message;
            errorDiv.style.display = 'block';
        }
    });
}

let categories = [];

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    // Login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const loginBtn = document.querySelector('#loginForm .btn');
            const errorDiv = document.getElementById('loginError');
            const originalText = loginBtn.innerHTML;
            
            loginBtn.innerHTML = 'Iniciando...';
            loginBtn.disabled = true;
            if (errorDiv) errorDiv.style.display = 'none';
            
            try {
                if (!supabase) {
                    throw new Error('Conexión no disponible');
                }
                
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: document.getElementById('email').value,
                    password: document.getElementById('password').value
                });
                
                if (error) throw error;
                
                document.getElementById('loginScreen').style.display = 'none';
                document.getElementById('dashboard').style.display = 'block';
                await loadCategories();
                await loadContent();
                
            } catch (error) {
                console.error('Error en login:', error);
                if (errorDiv) {
                    errorDiv.textContent = 'Error: ' + error.message;
                    errorDiv.style.display = 'block';
                }
            } finally {
                loginBtn.innerHTML = originalText;
                loginBtn.disabled = false;
            }
        });
    }

    // Inicializar navegación
    initializeNavigation();
    
    // Verificar sesión existente
    checkExistingSession();

    // Configurar event listeners de formularios
    setupFormListeners();
});

// Verificar sesión existente
async function checkExistingSession() {
    try {
        if (!supabase) return;
        
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('dashboard').style.display = 'block';
            await loadCategories();
            await loadContent();
        }
    } catch (error) {
        console.error('Error verificando sesión:', error);
    }
}

// Sidebar toggle
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('collapsed');
    }
}

// Navigation
function showTab(tabName) {
    console.log('Cambiando a tab:', tabName);
    
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Encontrar el nav item correcto
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        if (item.getAttribute('onclick') === `showTab('${tabName}')`) {
            item.classList.add('active');
        }
    });

    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Hide all action buttons
    const actionButtons = document.querySelectorAll('.header-actions .btn');
    actionButtons.forEach(btn => {
        btn.style.display = 'none';
    });

    // Show selected tab
    const tab = document.getElementById(tabName + 'Tab');
    if (tab) {
        tab.classList.add('active');
    }

    // Show corresponding action button
    let actionBtnId = '';
    switch(tabName) {
        case 'content':
            actionBtnId = 'addContentBtn';
            break;
        case 'categories':
            actionBtnId = 'addCategoriesBtn';
            break;
        case 'carousel':
            actionBtnId = 'addCarouselBtn';
            break;
        case 'events':
            actionBtnId = 'addEventsBtn';
            break;
    }
    
    const actionBtn = document.getElementById(actionBtnId);
    if (actionBtn) {
        actionBtn.style.display = 'flex';
        console.log('Mostrando botón:', actionBtnId);
    }

    // Update page title
    const pageTitle = document.getElementById('pageTitle');
    const tabTitles = {
        content: '📻 Contenido',
        categories: '🏷️ Categorías',
        carousel: '🎠 Carrusel',
        events: '📅 Eventos'
    };
    if (pageTitle && tabTitles[tabName]) {
        pageTitle.textContent = tabTitles[tabName];
    }

    // Load data
    switch(tabName) {
        case 'content':
            loadContent();
            break;
        case 'categories':
            loadCategories();
            break;
        case 'carousel':
            loadCarousel();
            break;
        case 'events':
            loadEvents();
            break;
    }
}

// Función para inicializar la navegación
function initializeNavigation() {
    // Asegurarse de que el botón de contenido esté visible al inicio
    const contentBtn = document.getElementById('addContentBtn');
    if (contentBtn) {
        contentBtn.style.display = 'flex';
    }
    
    // Ocultar los demás botones
    const otherButtons = ['addCategoriesBtn', 'addCarouselBtn', 'addEventsBtn'];
    otherButtons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.style.display = 'none';
        }
    });
}

// Configurar event listeners de formularios
function setupFormListeners() {
    // Event Form
    const eventForm = document.getElementById('eventForm');
    if (eventForm) {
        eventForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('eventId').value;
            const data = {
                title: document.getElementById('eventTitle').value,
                description: document.getElementById('eventDescription').value || null,
                event_date: document.getElementById('eventDate').value,
                start_time: document.getElementById('eventStartTime').value || null,
                end_time: document.getElementById('eventEndTime').value || null,
                image_url: document.getElementById('eventImage').value || null,
                is_reminder: document.getElementById('eventReminder').checked,
                is_active: document.getElementById('eventActive').checked
            };
            try {
                if (!supabase) throw new Error('Conexión no disponible');
                
                const result = id ? await supabase.from('events').update(data).eq('id', id) : await supabase.from('events').insert([data]);
                if (result.error) throw result.error;
                closeModal('eventModal');
                await loadEvents();
                alert(id ? '✅ Actualizado' : '✅ Creado');
            } catch (error) {
                console.error('Error saving event:', error);
                alert('❌ Error: ' + error.message);
            }
        });
    }

    // Category Form
    const categoryForm = document.getElementById('categoryForm');
    if (categoryForm) {
        categoryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('categoryId').value;
            const data = {
                name: document.getElementById('categoryName').value,
                color: document.getElementById('categoryColor').value || null,
                icon: document.getElementById('categoryIcon').value || null,
                screen: document.getElementById('categoryScreen').value
            };
            if (!data.screen) { alert('Selecciona pantalla'); return; }
            try {
                if (!supabase) throw new Error('Conexión no disponible');
                
                const result = id ? await supabase.from('categories').update(data).eq('id', id) : await supabase.from('categories').insert([data]);
                if (result.error) throw result.error;
                closeModal('categoryModal');
                await loadCategories();
                alert(id ? 'Actualizado' : 'Creado');
            } catch (error) {
                console.error('Error saving category:', error);
                alert('Error: ' + error.message);
            }
        });
    }

    // Content Form
    const contentForm = document.getElementById('contentForm');
    if (contentForm) {
        contentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('contentId').value;
            const data = {
                title: document.getElementById('contentTitle').value,
                description: document.getElementById('contentDescription').value || null,
                category_id: document.getElementById('contentCategory').value || null,
                thumbnail_url: document.getElementById('contentThumbnail').value || null,
                audio_url: document.getElementById('contentAudio').value || null,
                video_url: document.getElementById('contentVideo').value || null,
                is_active: document.getElementById('contentActive').checked
            };
            try {
                if (!supabase) throw new Error('Conexión no disponible');
                
                const result = id ? await supabase.from('radio_content').update(data).eq('id', id) : await supabase.from('radio_content').insert([data]);
                if (result.error) throw result.error;
                closeModal('contentModal');
                await loadContent();
                alert(id ? 'Actualizado' : 'Creado');
            } catch (error) {
                console.error('Error saving content:', error);
                alert('Error: ' + error.message);
            }
        });
    }

    // Carousel Form
    const carouselForm = document.getElementById('carouselForm');
    if (carouselForm) {
        carouselForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('carouselId').value;
            const data = {
                title: document.getElementById('carouselTitle').value,
                description: document.getElementById('carouselDescription').value || null,
                image_url: document.getElementById('carouselImage').value,
                order_position: parseInt(document.getElementById('carouselOrder').value),
                is_active: document.getElementById('carouselActive').checked
            };
            try {
                if (!supabase) throw new Error('Conexión no disponible');
                
                const result = id ? await supabase.from('carousel_items').update(data).eq('id', id) : await supabase.from('carousel_items').insert([data]);
                if (result.error) throw result.error;
                closeModal('carouselModal');
                await loadCarousel();
                alert(id ? 'Actualizado' : 'Creado');
            } catch (error) {
                console.error('Error saving carousel:', error);
                alert('Error: ' + error.message);
            }
        });
    }
}

// Modal functions
function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('active');
    }
}

// Close modals when clicking outside
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });
    });
});

// Logout
async function logout() {
    try {
        if (supabase) {
            await supabase.auth.signOut();
        }
        location.reload();
    } catch (error) {
        console.error('Error en logout:', error);
        location.reload();
    }
}

// EVENTOS
async function loadEvents() {
    try {
        if (!supabase) throw new Error('Conexión no disponible');
        
        const { data, error } = await supabase.from('events').select('*').order('event_date', { ascending: false });
        if (error) throw error;
        const list = document.getElementById('eventList');
        if (!list) return;
        
        if (data.length === 0) {
            list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📅</div><p>No hay eventos</p></div>';
            return;
        }
        list.innerHTML = '<table class="content-table"><thead><tr><th>Título</th><th>Fecha</th><th>Horario</th><th>Tipo</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>' + data.map(e => {
            const date = new Date(e.event_date + 'T00:00:00');
            const dateStr = date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
            let timeStr = 'Todo el día';
            if (e.start_time && e.end_time) timeStr = e.start_time + ' - ' + e.end_time;
            else if (e.start_time) timeStr = e.start_time;
            const type = e.is_reminder ? '<span class="badge badge-warning">🔔 Recordatorio</span>' : '<span class="badge badge-info">📅 Evento</span>';
            const status = '<span class="badge ' + (e.is_active ? 'badge-success">Activo' : 'badge-danger">Inactivo') + '</span>';
            return '<tr><td><strong>' + e.title + '</strong>' + (e.description ? '<br><small>' + e.description.substring(0,50) + '...</small>' : '') + '</td><td>' + dateStr + '</td><td>' + timeStr + '</td><td>' + type + '</td><td>' + status + '</td><td><div class="btn-group"><button class="btn-secondary btn-sm" onclick=\'editEvent(' + JSON.stringify(e).replace(/'/g, "&#39;") + ')\'>✏️</button><button class="btn-danger btn-sm" onclick="deleteEvent(\'' + e.id + '\', \'' + e.title.replace(/'/g, "&#39;") + '\')">🗑️</button></div></td></tr>';
        }).join('') + '</tbody></table>';
    } catch (error) {
        console.error('Error loading events:', error);
        const list = document.getElementById('eventList');
        if (list) {
            list.innerHTML = '<div class="error">Error: ' + error.message + '</div>';
        }
    }
}

function openAddEventModal() {
    const modal = document.getElementById('eventModal');
    if (modal) {
        document.getElementById('eventModalTitle').textContent = 'Agregar Evento';
        document.getElementById('eventForm').reset();
        document.getElementById('eventId').value = '';
        document.getElementById('eventActive').checked = true;
        document.getElementById('eventDate').min = new Date().toISOString().split('T')[0];
        modal.classList.add('active');
    }
}

function editEvent(event) {
    const modal = document.getElementById('eventModal');
    if (modal) {
        document.getElementById('eventModalTitle').textContent = 'Editar Evento';
        document.getElementById('eventId').value = event.id;
        document.getElementById('eventTitle').value = event.title;
        document.getElementById('eventDescription').value = event.description || '';
        document.getElementById('eventDate').value = event.event_date;
        document.getElementById('eventStartTime').value = event.start_time || '';
        document.getElementById('eventEndTime').value = event.end_time || '';
        document.getElementById('eventImage').value = event.image_url || '';
        document.getElementById('eventReminder').checked = event.is_reminder;
        document.getElementById('eventActive').checked = event.is_active;
        modal.classList.add('active');
    }
}

async function deleteEvent(id, title) {
    if (!confirm('¿Eliminar "' + title + '"?')) return;
    try {
        if (!supabase) throw new Error('Conexión no disponible');
        
        const { error } = await supabase.from('events').delete().eq('id', id);
        if (error) throw error;
        await loadEvents();
        alert('✅ Eliminado');
    } catch (error) {
        console.error('Error deleting event:', error);
        alert('❌ Error: ' + error.message);
    }
}

// CATEGORÍAS
async function loadCategories() {
    try {
        if (!supabase) throw new Error('Conexión no disponible');
        
        const { data, error } = await supabase.from('categories').select('*').order('name');
        if (error) throw error;
        categories = data;
        
        const categorySelect = document.getElementById('contentCategory');
        if (categorySelect) {
            categorySelect.innerHTML = '<option value="">Sin categoría</option>' + data.map(c => '<option value="' + c.id + '">' + c.name + '</option>').join('');
        }
        
        const list = document.getElementById('categoryList');
        if (!list) return;
        
        if (data.length === 0) {
            list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📂</div><p>No hay categorías</p></div>';
            return;
        }
        list.innerHTML = '<table class="content-table"><thead><tr><th>Nombre</th><th>Color</th><th>Ícono</th><th>Pantalla</th><th>Acciones</th></tr></thead><tbody>' + data.map(c => {
            let screen = '';
            if (c.screen === 'home') screen = '<span class="badge badge-success">🏠 Inicio</span>';
            else if (c.screen === 'grupos') screen = '<span class="badge" style="background:#e3f2fd;color:#1976d2">👥 Grupos</span>';
            else if (c.screen === 'both') screen = '<span class="badge" style="background:#f3e5f5;color:#7b1fa2">🔄 Ambas</span>';
            return '<tr><td><strong>' + c.name + '</strong></td><td><div style="display:flex;align-items:center;gap:8px"><span style="display:inline-block;width:20px;height:20px;background:' + (c.color || '#666') + ';border-radius:4px"></span>' + (c.color || 'N/A') + '</div></td><td>' + (c.icon || 'N/A') + '</td><td>' + screen + '</td><td><div class="btn-group"><button class="btn-secondary btn-sm" onclick=\'editCategory(' + JSON.stringify(c).replace(/'/g, "&#39;") + ')\'>✏️</button><button class="btn-danger btn-sm" onclick="deleteCategory(\'' + c.id + '\',\'' + c.name.replace(/'/g, "&#39;") + '\')">🗑️</button></div></td></tr>';
        }).join('') + '</tbody></table>';
    } catch (error) {
        console.error('Error loading categories:', error);
        const list = document.getElementById('categoryList');
        if (list) {
            list.innerHTML = '<div class="error">Error: ' + error.message + '</div>';
        }
    }
}

function openAddCategoryModal() {
    const modal = document.getElementById('categoryModal');
    if (modal) {
        document.getElementById('categoryModalTitle').textContent = 'Agregar Categoría';
        document.getElementById('categoryForm').reset();
        document.getElementById('categoryId').value = '';
        modal.classList.add('active');
    }
}

function editCategory(cat) {
    const modal = document.getElementById('categoryModal');
    if (modal) {
        document.getElementById('categoryModalTitle').textContent = 'Editar Categoría';
        document.getElementById('categoryId').value = cat.id;
        document.getElementById('categoryName').value = cat.name;
        document.getElementById('categoryColor').value = cat.color || '';
        document.getElementById('categoryIcon').value = cat.icon || '';
        document.getElementById('categoryScreen').value = cat.screen || '';
        modal.classList.add('active');
    }
}

async function deleteCategory(id, name) {
    if (!confirm('¿Eliminar "' + name + '"?')) return;
    try {
        if (!supabase) throw new Error('Conexión no disponible');
        
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (error) throw error;
        await loadCategories();
        alert('Eliminado');
    } catch (error) {
        console.error('Error deleting category:', error);
        alert('Error: ' + error.message);
    }
}

// CONTENIDO
async function loadContent() {
    try {
        if (!supabase) throw new Error('Conexión no disponible');
        
        const { data, error } = await supabase.from('radio_content').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        const list = document.getElementById('contentList');
        if (!list) return;
        
        if (data.length === 0) {
            list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📻</div><p>No hay contenido</p></div>';
            return;
        }
        list.innerHTML = '<table class="content-table"><thead><tr><th>Título</th><th>Audio</th><th>Video</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>' + data.map(c => '<tr><td><strong>' + c.title + '</strong><br><small>' + (c.description || '') + '</small></td><td>' + (c.audio_url ? '✅' : '❌') + '</td><td>' + (c.video_url ? '✅' : '❌') + '</td><td><span class="badge ' + (c.is_active ? 'badge-success">Activo' : 'badge-danger">Inactivo') + '</span></td><td><div class="btn-group"><button class="btn-secondary btn-sm" onclick=\'editContent(' + JSON.stringify(c) + ')\'>✏️</button><button class="btn-danger btn-sm" onclick="deleteContent(\'' + c.id + '\',\'' + c.title + '\')">🗑️</button></div></td></tr>').join('') + '</tbody></table>';
    } catch (error) {
        console.error('Error loading content:', error);
        const list = document.getElementById('contentList');
        if (list) {
            list.innerHTML = '<div class="error">Error: ' + error.message + '</div>';
        }
    }
}

function openAddContentModal() {
    const modal = document.getElementById('contentModal');
    if (modal) {
        document.getElementById('contentModalTitle').textContent = 'Agregar Contenido';
        document.getElementById('contentForm').reset();
        document.getElementById('contentId').value = '';
        document.getElementById('contentActive').checked = true;
        modal.classList.add('active');
    }
}

function editContent(c) {
    const modal = document.getElementById('contentModal');
    if (modal) {
        document.getElementById('contentModalTitle').textContent = 'Editar Contenido';
        document.getElementById('contentId').value = c.id;
        document.getElementById('contentTitle').value = c.title;
        document.getElementById('contentDescription').value = c.description || '';
        document.getElementById('contentCategory').value = c.category_id || '';
        document.getElementById('contentThumbnail').value = c.thumbnail_url || '';
        document.getElementById('contentAudio').value = c.audio_url || '';
        document.getElementById('contentVideo').value = c.video_url || '';
        document.getElementById('contentActive').checked = c.is_active;
        modal.classList.add('active');
    }
}

async function deleteContent(id, title) {
    if (!confirm('¿Eliminar "' + title + '"?')) return;
    try {
        if (!supabase) throw new Error('Conexión no disponible');
        
        const { error } = await supabase.from('radio_content').delete().eq('id', id);
        if (error) throw error;
        await loadContent();
        alert('Eliminado');
    } catch (error) {
        console.error('Error deleting content:', error);
        alert('Error: ' + error.message);
    }
}

// CARRUSEL
async function loadCarousel() {
    try {
        if (!supabase) throw new Error('Conexión no disponible');
        
        const { data, error } = await supabase.from('carousel_items').select('*').order('order_position');
        if (error) throw error;
        const list = document.getElementById('carouselList');
        if (!list) return;
        
        if (data.length === 0) {
            list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎠</div><p>No hay banners</p></div>';
            return;
        }
        list.innerHTML = '<table class="content-table"><thead><tr><th>Título</th><th>Orden</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>' + data.map(c => '<tr><td><strong>' + c.title + '</strong><br><small>' + (c.description || '') + '</small></td><td>' + c.order_position + '</td><td><span class="badge ' + (c.is_active ? 'badge-success">Activo' : 'badge-danger">Inactivo') + '</span></td><td><div class="btn-group"><button class="btn-secondary btn-sm" onclick=\'editCarousel(' + JSON.stringify(c) + ')\'>✏️</button><button class="btn-danger btn-sm" onclick="deleteCarousel(\'' + c.id + '\',\'' + c.title + '\')">🗑️</button></div></td></tr>').join('') + '</tbody></table>';
    } catch (error) {
        console.error('Error loading carousel:', error);
        const list = document.getElementById('carouselList');
        if (list) {
            list.innerHTML = '<div class="error">Error: ' + error.message + '</div>';
        }
    }
}

function openAddCarouselModal() {
    const modal = document.getElementById('carouselModal');
    if (modal) {
        document.getElementById('carouselModalTitle').textContent = 'Agregar Banner';
        document.getElementById('carouselForm').reset();
        document.getElementById('carouselId').value = '';
        document.getElementById('carouselActive').checked = true;
        modal.classList.add('active');
    }
}

function editCarousel(c) {
    const modal = document.getElementById('carouselModal');
    if (modal) {
        document.getElementById('carouselModalTitle').textContent = 'Editar Banner';
        document.getElementById('carouselId').value = c.id;
        document.getElementById('carouselTitle').value = c.title;
        document.getElementById('carouselDescription').value = c.description || '';
        document.getElementById('carouselImage').value = c.image_url;
        document.getElementById('carouselOrder').value = c.order_position;
        document.getElementById('carouselActive').checked = c.is_active;
        modal.classList.add('active');
    }
}

async function deleteCarousel(id, title) {
    if (!confirm('¿Eliminar "' + title + '"?')) return;
    try {
        if (!supabase) throw new Error('Conexión no disponible');
        
        const { error } = await supabase.from('carousel_items').delete().eq('id', id);
        if (error) throw error;
        await loadCarousel();
        alert('Eliminado');
    } catch (error) {
        console.error('Error deleting carousel:', error);
        alert('Error: ' + error.message);
    }
}