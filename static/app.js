// Admin Accounts and Role-based Data
const adminAccounts = [
  {
    uid: "super-admin-123",
    email: "demo@example.com",
    password: "demo123", 
    displayName: "Super Admin",
    role: "super_admin",
    permissions: ["all"],
    assignedEvents: [1, 2, 3],
    photoURL: "https://via.placeholder.com/40/0066cc/ffffff?text=SA"
  },
  {
    uid: "event-manager-456",
    email: "eventmanager@certiportal.com",
    password: "event123",
    displayName: "Event Manager",
    role: "event_manager", 
    permissions: ["events", "participants"],
    assignedEvents: [1, 3],
    photoURL: "https://via.placeholder.com/40/00aa66/ffffff?text=EM"
  },
  {
    uid: "marketing-manager-789",
    email: "marketing@certiportal.com", 
    password: "market123",
    displayName: "Marketing Manager",
    role: "marketing_manager",
    permissions: ["generation", "analytics", "emails"],
    assignedEvents: [1, 2],
    photoURL: "https://via.placeholder.com/40/ff6600/ffffff?text=MM"
  },
  {
    uid: "ops-manager-101",
    email: "ops@certiportal.com",
    password: "ops123", 
    displayName: "Operations Manager",
    role: "operations_manager",
    permissions: ["generation", "system"],
    assignedEvents: [2],
    photoURL: "https://via.placeholder.com/40/9900cc/ffffff?text=OM"
  }
];

const allEvents = [
  {
    id: 1,
    name: "CampusToCode 2025",
    status: "active",
    participantCount: 245,
    certificatesGenerated: 240,
    emailsSent: 238,
    createdDate: "2025-08-15",
    assignedTo: ["super_admin", "event_manager", "marketing_manager"],
    template: "template1.png"
  },
  {
    id: 2,
    name: "Python Workshop",
    status: "completed", 
    participantCount: 89,
    certificatesGenerated: 89,
    emailsSent: 87,
    createdDate: "2025-07-20",
    assignedTo: ["super_admin", "marketing_manager", "operations_manager"],
    template: "template2.png"
  },
  {
    id: 3,
    name: "DataScience101", 
    status: "draft",
    participantCount: 0,
    certificatesGenerated: 0,
    emailsSent: 0,
    createdDate: "2025-09-01",
    assignedTo: ["super_admin", "event_manager"],
    template: null
  }
];

const roleBasedData = {
  super_admin: {
    totalEvents: 3,
    totalParticipants: 334,
    totalCertificates: 329,
    totalEmails: 325,
    deliveryRate: 98.2,
    welcomeMessage: "Welcome back, Super Admin! You have full system access."
  },
  event_manager: {
    totalEvents: 2,
    totalParticipants: 245,
    totalCertificates: 240,
    totalEmails: 238,
    deliveryRate: 97.9,
    welcomeMessage: "Welcome back, Event Manager! Manage your assigned events."
  },
  marketing_manager: {
    totalEvents: 2,
    totalParticipants: 334,
    totalCertificates: 329,
    totalEmails: 325,
    deliveryRate: 98.2,
    welcomeMessage: "Welcome back, Marketing Manager! Track your email campaigns."
  },
  operations_manager: {
    totalEvents: 1,
    totalParticipants: 89,
    totalCertificates: 89,
    totalEmails: 87,
    deliveryRate: 97.8,
    welcomeMessage: "Welcome back, Operations Manager! Monitor system performance."
  }
};

const navigationByRole = {
  super_admin: ["dashboard", "events", "participants", "generation", "analytics", "settings"],
  event_manager: ["dashboard", "events", "participants"], 
  marketing_manager: ["dashboard", "generation", "analytics"],
  operations_manager: ["dashboard", "generation", "system"]
};

// Application Data
const appData = {
  participants: [
    {
      id: 1,
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "+1234567890",
      eventId: 1,
      certificateGenerated: true,
      emailSent: true,
      downloaded: true
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane.smith@example.com", 
      phone: "+1234567891",
      eventId: 1,
      certificateGenerated: true,
      emailSent: true,
      downloaded: false
    },
    {
      id: 3,
      name: "Bob Johnson",
      email: "bob.johnson@example.com",
      phone: "",
      eventId: 2,
      certificateGenerated: true,
      emailSent: false,
      downloaded: false
    },
    {
      id: 4,
      name: "Alice Brown",
      email: "alice.brown@example.com",
      phone: "+1234567893",
      eventId: 1,
      certificateGenerated: true,
      emailSent: true,
      downloaded: true
    },
    {
      id: 5,
      name: "Charlie Wilson",
      email: "charlie.wilson@example.com",
      phone: "+1234567894",
      eventId: 2,
      certificateGenerated: true,
      emailSent: true,
      downloaded: false
    }
  ],
  analytics: {
    totalCertificates: 329,
    totalEmails: 325,
    deliveryRate: 98.2,
    downloadRate: 67.5,
    emailStats: {
      sent: 325,
      delivered: 319,
      opened: 284,
      bounced: 6,
      failed: 4
    },
    monthlyTrends: [
      {"month": "Jan", "certificates": 45, "emails": 43},
      {"month": "Feb", "certificates": 67, "emails": 65},
      {"month": "Mar", "certificates": 89, "emails": 87},
      {"month": "Apr", "certificates": 123, "emails": 120},
      {"month": "May", "certificates": 156, "emails": 152}
    ]
  }
};

// Application State
let currentUser = null;
let isAuthenticated = false;
let currentPage = 'landing-page';
let currentAdminSection = 'dashboard';
let currentLoginTab = 'login';

// Utility Functions
function showLoading() {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.classList.remove('hidden');
  }
}

function hideLoading() {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.classList.add('hidden');
  }
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    if (toast.parentNode) {
      toast.remove();
    }
  }, 4000);
}

function showPage(pageId) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  
  // Show target page
  const targetPage = document.getElementById(pageId);
  if (targetPage) {
    targetPage.classList.add('active');
    currentPage = pageId;
  }
}

function showAdminSection(sectionId) {
  // Update navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  
  const activeNav = document.querySelector(`[data-page="${sectionId}"]`);
  if (activeNav) {
    activeNav.classList.add('active');
  }
  
  // Update content areas
  document.querySelectorAll('.content-area').forEach(area => {
    area.classList.remove('active');
  });
  
  const targetContent = document.getElementById(`${sectionId}-content`);
  if (targetContent) {
    targetContent.classList.add('active');
  }
  
  // Update page title
  const titles = {
    dashboard: 'Dashboard',
    events: 'Event Management',
    participants: 'Participant Management',
    generation: 'Certificate Generation',
    analytics: 'Analytics Dashboard',
    system: 'System Monitor',
    settings: 'System Settings'
  };
  
  const titleElement = document.getElementById('current-page-title');
  if (titleElement) {
    titleElement.textContent = titles[sectionId] || sectionId;
  }
  
  currentAdminSection = sectionId;
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('hidden');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('hidden');
  }
}

// Role-based Functions
function getUserEvents(user) {
  if (!user) return [];
  
  if (user.permissions.includes("all")) {
    return allEvents;
  }
  
  return allEvents.filter(event => 
    event.assignedTo.includes(user.role) || 
    user.assignedEvents.includes(event.id)
  );
}

function hasPermission(user, permission) {
  if (!user) return false;
  return user.permissions.includes("all") || user.permissions.includes(permission);
}

function updateNavigationForRole(user) {
  if (!user) return;
  
  const allowedSections = navigationByRole[user.role] || ["dashboard"];
  
  // Hide/show navigation items based on role
  document.querySelectorAll('.nav-item').forEach(navItem => {
    const page = navItem.dataset.page;
    const permission = navItem.dataset.permission;
    
    if (page === 'dashboard') {
      navItem.classList.remove('hidden');
    } else if (permission && !hasPermission(user, permission)) {
      navItem.classList.add('hidden');
    } else if (allowedSections.includes(page)) {
      navItem.classList.remove('hidden');
    } else {
      navItem.classList.add('hidden');
    }
  });
}

function updateUserInterface(user) {
  if (!user) return;
  
  // Update user info in sidebar
  const userName = document.getElementById('user-name');
  const userEmail = document.getElementById('user-email');
  const userRole = document.getElementById('user-role');
  const userAvatar = document.getElementById('user-avatar');
  
  if (userName) userName.textContent = user.displayName;
  if (userEmail) userEmail.textContent = user.email;
  if (userRole) userRole.textContent = user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  if (userAvatar) {
    userAvatar.style.backgroundImage = `url(${user.photoURL})`;
    userAvatar.textContent = user.displayName.split(' ').map(n => n[0]).join('');
  }
  
  // Update welcome message
  const welcomeMessage = document.getElementById('welcome-message');
  const roleData = roleBasedData[user.role];
  if (welcomeMessage && roleData) {
    welcomeMessage.textContent = roleData.welcomeMessage;
  }
  
  // Update navigation
  updateNavigationForRole(user);
}

function getRoleSpecificStats(user) {
  if (!user) return null;
  return roleBasedData[user.role] || null;
}

// Login Modal Functions
function openLoginModal() {
  const modal = document.getElementById('login-modal');
  if (modal) {
    modal.classList.remove('hidden');
    setTimeout(() => {
      const activeTabContent = document.querySelector('.tab-content.active');
      const firstInput = activeTabContent?.querySelector('input');
      if (firstInput) {
        firstInput.focus();
      }
    }, 100);
  }
}

function closeLoginModal() {
  const modal = document.getElementById('login-modal');
  if (modal) {
    modal.classList.add('hidden');
    document.querySelectorAll('.login-form').forEach(form => {
      form.reset();
    });
  }
}

function switchLoginTab(tabName) {
  // Update tab buttons
  document.querySelectorAll('.login-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  
  const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
  if (activeTab) {
    activeTab.classList.add('active');
  }
  
  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  
  const activeContent = document.getElementById(`${tabName}-tab-content`);
  if (activeContent) {
    activeContent.classList.add('active');
  }
  
  currentLoginTab = tabName;
  
  setTimeout(() => {
    const firstInput = activeContent?.querySelector('input');
    if (firstInput) {
      firstInput.focus();
    }
  }, 100);
}

// Authentication Functions
function authenticateUser(email, password) {
  return adminAccounts.find(account => 
    account.email === email && account.password === password
  );
}

function simulateLogin(method, credentials = null) {
  showLoading();
  
  setTimeout(() => {
    hideLoading();
    isAuthenticated = true;
    
    closeLoginModal();
    showPage('admin-dashboard');
    updateUserInterface(currentUser);
    loadDashboard();
    showToast(`Successfully logged in as ${currentUser.displayName}`, 'success');
  }, 1000);
}

function handleLogin(email, password) {
  const user = authenticateUser(email, password);
  
  if (user) {
    currentUser = user;
    simulateLogin('Email', { email, password });
  } else if (email && password) {
    showToast('Invalid credentials. Please check the demo accounts.', 'error');
  } else {
    showToast('Please enter email and password', 'error');
  }
}

function handleSignup(name, email, password, confirmPassword) {
  if (!name || !email || !password || !confirmPassword) {
    showToast('Please fill in all fields', 'error');
    return;
  }
  
  if (password !== confirmPassword) {
    showToast('Passwords do not match', 'error');
    return;
  }
  
  // Set as super admin for demo
  currentUser = adminAccounts[0];
  simulateLogin('Sign Up');
}

function handleMagicLink(email) {
  if (!email) {
    showToast('Please enter your email address', 'error');
    return;
  }
  
  const user = adminAccounts.find(acc => acc.email === email);
  
  showLoading();
  setTimeout(() => {
    hideLoading();
    showToast('Magic link sent to your email!', 'success');
    
    setTimeout(() => {
      if (user) {
        currentUser = user;
        simulateLogin('Magic Link');
      } else {
        currentUser = adminAccounts[0]; // Default to super admin
        simulateLogin('Magic Link');
      }
    }, 2000);
  }, 1000);
}

function logout() {
  isAuthenticated = false;
  currentUser = null;
  showPage('landing-page');
  showToast('Successfully logged out', 'info');
}

// Landing Page Functions
function loadEventOptions() {
  const select = document.getElementById('event-select');
  if (!select) return;
  
  const activeEvents = allEvents.filter(event => event.status !== 'draft');
  
  select.innerHTML = '<option value="">Choose an event</option>';
  activeEvents.forEach(event => {
    const option = document.createElement('option');
    option.value = event.id;
    option.textContent = event.name;
    select.appendChild(option);
  });
}

function verifyCertificate(email, eventId) {
  const participant = appData.participants.find(p => 
    p.email.toLowerCase() === email.toLowerCase() && 
    p.eventId === parseInt(eventId)
  );
  
  const resultDiv = document.getElementById('verification-result');
  if (!resultDiv) return;
  
  if (participant && participant.certificateGenerated) {
    resultDiv.className = 'verification-result success';
    resultDiv.innerHTML = `
      <h3>✅ Certificate Found!</h3>
      <p>Hello ${participant.name}, your certificate is ready for download.</p>
      <button class="btn btn--primary" onclick="downloadCertificate(${participant.id})">
        Download Certificate
      </button>
    `;
  } else if (participant) {
    resultDiv.className = 'verification-result error';
    resultDiv.innerHTML = `
      <h3>⏳ Certificate Pending</h3>
      <p>Hello ${participant.name}, your certificate is being generated. Please check back later.</p>
    `;
  } else {
    resultDiv.className = 'verification-result error';
    resultDiv.innerHTML = `
      <h3>❌ Certificate Not Found</h3>
      <p>No certificate found for this email and event combination. Please check your details.</p>
    `;
  }
  
  resultDiv.classList.remove('hidden');
}

function downloadCertificate(participantId) {
  const participant = appData.participants.find(p => p.id === participantId);
  if (participant) {
    showToast(`Downloading certificate for ${participant.name}`, 'success');
    participant.downloaded = true;
    
    setTimeout(() => {
      showToast('Certificate download completed!', 'success');
    }, 1000);
  }
}

// Dashboard Functions
function loadDashboard() {
  if (!currentUser) return;
  
  const userEvents = getUserEvents(currentUser);
  const roleStats = getRoleSpecificStats(currentUser);
  
  if (roleStats) {
    // Update stat cards based on role
    const elements = {
      'total-events': roleStats.totalEvents,
      'total-participants': roleStats.totalParticipants,
      'total-certificates': roleStats.totalCertificates,
      'total-emails': roleStats.totalEmails
    };
    
    Object.entries(elements).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) element.textContent = value;
    });
    
    // Update delivery rate
    const deliveryRate = document.getElementById('delivery-rate');
    if (deliveryRate) {
      deliveryRate.textContent = `${roleStats.deliveryRate}% delivery rate`;
    }
    
    // Customize fourth stat card based on role
    const statEmailsTitle = document.getElementById('stat-emails-title');
    const statEmailsIcon = document.getElementById('stat-emails-icon');
    
    if (currentUser.role === 'operations_manager') {
      if (statEmailsTitle) statEmailsTitle.textContent = 'System Uptime';
      if (statEmailsIcon) statEmailsIcon.textContent = '⚙️';
      if (deliveryRate) deliveryRate.textContent = '99.9% uptime';
    }
  }
  
  // Load chart with role-specific data
  loadMonthlyTrendsChart();
  
  // Load recent events for this user
  loadRecentEvents();
  
  // Update recent events title based on role
  const recentEventsTitle = document.getElementById('recent-events-title');
  if (recentEventsTitle) {
    if (currentUser.role === 'super_admin') {
      recentEventsTitle.textContent = 'All Events';
    } else {
      recentEventsTitle.textContent = 'Your Assigned Events';
    }
  }
  
  // Load event options for other sections
  loadEventSelectOptions();
}

function loadMonthlyTrendsChart() {
  const ctx = document.getElementById('monthly-trends-chart');
  if (!ctx) return;
  
  try {
    // Customize chart data based on user role
    let chartTitle = 'Monthly Trends';
    let datasets = [];
    
    if (currentUser.role === 'marketing_manager') {
      chartTitle = 'Email Campaign Performance';
      datasets = [
        {
          label: 'Emails Sent',
          data: appData.analytics.monthlyTrends.map(item => item.emails),
          borderColor: '#1FB8CD',
          backgroundColor: 'rgba(31, 184, 205, 0.1)',
          tension: 0.4
        },
        {
          label: 'Open Rate %',
          data: [85, 87, 82, 89, 91],
          borderColor: '#FFC185',
          backgroundColor: 'rgba(255, 193, 133, 0.1)',
          tension: 0.4,
          yAxisID: 'y1'
        }
      ];
    } else if (currentUser.role === 'operations_manager') {
      chartTitle = 'System Performance';
      datasets = [
        {
          label: 'Processing Queue',
          data: [12, 8, 15, 6, 3],
          borderColor: '#1FB8CD',
          backgroundColor: 'rgba(31, 184, 205, 0.1)',
          tension: 0.4
        },
        {
          label: 'Response Time (ms)',
          data: [250, 230, 280, 210, 195],
          borderColor: '#B4413C',
          backgroundColor: 'rgba(180, 65, 60, 0.1)',
          tension: 0.4,
          yAxisID: 'y1'
        }
      ];
    } else {
      datasets = [
        {
          label: 'Certificates Generated',
          data: appData.analytics.monthlyTrends.map(item => item.certificates),
          borderColor: '#1FB8CD',
          backgroundColor: 'rgba(31, 184, 205, 0.1)',
          tension: 0.4
        },
        {
          label: 'Emails Sent',
          data: appData.analytics.monthlyTrends.map(item => item.emails),
          borderColor: '#FFC185',
          backgroundColor: 'rgba(255, 193, 133, 0.1)',
          tension: 0.4
        }
      ];
    }
    
    const scales = {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        beginAtZero: true
      }
    };
    
    if (currentUser.role === 'marketing_manager' || currentUser.role === 'operations_manager') {
      scales.y1 = {
        type: 'linear',
        display: true,
        position: 'right',
        beginAtZero: true,
        grid: {
          drawOnChartArea: false
        }
      };
    }
    
    new Chart(ctx.getContext('2d'), {
      type: 'line',
      data: {
        labels: appData.analytics.monthlyTrends.map(item => item.month),
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: chartTitle
          }
        },
        scales: scales
      }
    });
  } catch (error) {
    console.warn('Chart.js not loaded or error creating chart:', error);
  }
}

function loadRecentEvents() {
  const container = document.getElementById('recent-events-list');
  if (!container) return;
  
  container.innerHTML = '';
  
  const userEvents = getUserEvents(currentUser);
  const eventsToShow = userEvents.slice(-3);
  
  eventsToShow.forEach(event => {
    const eventCard = createEventCard(event);
    container.appendChild(eventCard);
  });
  
  if (eventsToShow.length === 0) {
    container.innerHTML = '<p class="text-center">No events assigned to your role.</p>';
  }
}

function createEventCard(event) {
  const card = document.createElement('div');
  card.className = 'event-card';
  
  card.innerHTML = `
    <div class="event-header">
      <h4 class="event-title">${event.name}</h4>
      <span class="event-status ${event.status}">${event.status}</span>
    </div>
    <div class="event-stats">
      <div class="event-stat">
        <div class="event-stat-value">${event.participantCount}</div>
        <div class="event-stat-label">Participants</div>
      </div>
      <div class="event-stat">
        <div class="event-stat-value">${event.certificatesGenerated}</div>
        <div class="event-stat-label">Certificates</div>
      </div>
    </div>
    <div class="event-actions">
      <button class="btn btn--sm btn--primary" onclick="editEvent(${event.id})">Edit</button>
      <button class="btn btn--sm btn--secondary" onclick="viewEvent(${event.id})">View</button>
    </div>
  `;
  
  return card;
}

function loadEventSelectOptions() {
  const selects = [
    'generation-event-select',
    'event-filter',
    'csv-event-select'
  ];
  
  const userEvents = getUserEvents(currentUser);
  
  selects.forEach(selectId => {
    const select = document.getElementById(selectId);
    if (select) {
      select.innerHTML = '<option value="">Select Event</option>';
      userEvents.forEach(event => {
        const option = document.createElement('option');
        option.value = event.id;
        option.textContent = event.name;
        select.appendChild(option);
      });
    }
  });
}

// Events Management
function loadEventsManagement() {
  const container = document.getElementById('events-list');
  if (!container) return;
  
  container.innerHTML = '';
  
  const userEvents = getUserEvents(currentUser);
  
  userEvents.forEach(event => {
    const eventCard = createEventCard(event);
    container.appendChild(eventCard);
  });
  
  if (userEvents.length === 0) {
    container.innerHTML = '<p class="text-center">No events assigned to your role.</p>';
  }
}

function editEvent(eventId) {
  const event = allEvents.find(e => e.id === eventId);
  if (event) {
    showToast(`Editing event: ${event.name}`, 'info');
  }
}

function viewEvent(eventId) {
  const event = allEvents.find(e => e.id === eventId);
  if (event) {
    showToast(`Viewing event: ${event.name}`, 'info');
  }
}

function createEvent(eventData) {
  const newEvent = {
    id: allEvents.length + 1,
    name: eventData.name,
    status: 'draft',
    participantCount: 0,
    certificatesGenerated: 0,
    emailsSent: 0,
    createdDate: new Date().toISOString().split('T')[0],
    assignedTo: [currentUser.role],
    template: eventData.template ? 'uploaded-template.png' : null
  };
  
  allEvents.push(newEvent);
  loadEventsManagement();
  loadEventSelectOptions();
  showToast('Event created successfully!', 'success');
}

// Participants Management
function loadParticipantsManagement() {
  const container = document.getElementById('participants-list');
  if (!container) return;
  
  container.innerHTML = `
    <div class="table-header">
      <div>Name</div>
      <div>Email</div>
      <div>Phone</div>
      <div>Event</div>
      <div>Certificate</div>
      <div>Downloaded</div>
    </div>
  `;
  
  const userEvents = getUserEvents(currentUser);
  const userEventIds = userEvents.map(e => e.id);
  const filteredParticipants = appData.participants.filter(p => userEventIds.includes(p.eventId));
  
  filteredParticipants.forEach(participant => {
    const event = allEvents.find(e => e.id === participant.eventId);
    const row = document.createElement('div');
    row.className = 'table-row';
    
    row.innerHTML = `
      <div>${participant.name}</div>
      <div>${participant.email}</div>
      <div>${participant.phone || 'N/A'}</div>
      <div>${event ? event.name : 'Unknown'}</div>
      <div>
        <span class="status ${participant.certificateGenerated ? 'status--success' : 'status--warning'}">
          ${participant.certificateGenerated ? 'Generated' : 'Pending'}
        </span>
      </div>
      <div>
        <span class="status ${participant.downloaded ? 'status--success' : 'status--error'}">
          ${participant.downloaded ? 'Yes' : 'No'}
        </span>
      </div>
    `;
    
    container.appendChild(row);
  });
  
  if (filteredParticipants.length === 0) {
    const row = document.createElement('div');
    row.className = 'table-row';
    row.innerHTML = '<div colspan="6" style="text-align: center;">No participants found for your assigned events.</div>';
    container.appendChild(row);
  }
}

// Certificate Generation
function generateCertificates(eventId) {
  const event = allEvents.find(e => e.id === parseInt(eventId));
  if (!event) {
    showToast('Please select an event', 'error');
    return;
  }
  
  // Check if user has access to this event
  const userEvents = getUserEvents(currentUser);
  if (!userEvents.find(e => e.id === event.id)) {
    showToast('You do not have access to this event', 'error');
    return;
  }
  
  const progressSection = document.getElementById('generation-progress');
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');
  
  if (progressSection) progressSection.classList.remove('hidden');
  
  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 15;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      
      const eventParticipants = appData.participants.filter(p => p.eventId === event.id);
      eventParticipants.forEach(p => {
        p.certificateGenerated = true;
        p.emailSent = true;
      });
      
      event.certificatesGenerated = eventParticipants.length;
      event.emailsSent = eventParticipants.length;
      
      showToast('Certificates generated and emails sent successfully!', 'success');
      loadDashboard();
      if (hasPermission(currentUser, 'participants')) {
        loadParticipantsManagement();
      }
    }
    
    if (progressFill) progressFill.style.width = `${progress}%`;
    if (progressText) progressText.textContent = `${Math.round(progress)}%`;
  }, 500);
}

// Analytics
function loadAnalytics() {
  const roleStats = getRoleSpecificStats(currentUser);
  const userEvents = getUserEvents(currentUser);
  
  // Calculate role-specific metrics
  const userEventIds = userEvents.map(e => e.id);
  const userParticipants = appData.participants.filter(p => userEventIds.includes(p.eventId));
  
  const downloadedCount = userParticipants.filter(p => p.downloaded).length;
  const totalGenerated = userParticipants.filter(p => p.certificateGenerated).length;
  
  const elements = {
    'total-downloads': downloadedCount,
    'download-rate': totalGenerated > 0 ? `${((downloadedCount / totalGenerated) * 100).toFixed(1)}%` : '0%',
    'pending-downloads': totalGenerated - downloadedCount
  };
  
  Object.entries(elements).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  });
  
  loadEmailStatsChart();
}

function loadEmailStatsChart() {
  const ctx = document.getElementById('email-stats-chart');
  if (!ctx) return;
  
  try {
    // Customize chart based on role
    let chartData;
    let chartTitle = 'Email Delivery Statistics';
    
    if (currentUser.role === 'marketing_manager') {
      chartTitle = 'Campaign Performance';
      chartData = {
        labels: ['Delivered', 'Opened', 'Clicked', 'Unsubscribed'],
        datasets: [{
          data: [
            appData.analytics.emailStats.delivered,
            appData.analytics.emailStats.opened,
            Math.floor(appData.analytics.emailStats.opened * 0.3),
            Math.floor(appData.analytics.emailStats.delivered * 0.02)
          ],
          backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5']
        }]
      };
    } else if (currentUser.role === 'operations_manager') {
      chartTitle = 'System Status';
      chartData = {
        labels: ['Operational', 'Processing', 'Queue', 'Errors'],
        datasets: [{
          data: [87, 8, 4, 1],
          backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5']
        }]
      };
    } else {
      chartData = {
        labels: ['Delivered', 'Opened', 'Bounced', 'Failed'],
        datasets: [{
          data: [
            appData.analytics.emailStats.delivered,
            appData.analytics.emailStats.opened,
            appData.analytics.emailStats.bounced,
            appData.analytics.emailStats.failed
          ],
          backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5']
        }]
      };
    }
    
    new Chart(ctx.getContext('2d'), {
      type: 'doughnut',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: chartTitle
          }
        }
      }
    });
  } catch (error) {
    console.warn('Chart.js not loaded or error creating chart:', error);
  }
}

function exportReport() {
  showToast('Report exported successfully!', 'success');
}

function uploadParticipants(eventId, csvData) {
  const event = allEvents.find(e => e.id === parseInt(eventId));
  if (!event) return;
  
  // Check if user has access to this event
  const userEvents = getUserEvents(currentUser);
  if (!userEvents.find(e => e.id === event.id)) {
    showToast('You do not have access to this event', 'error');
    return;
  }
  
  const newParticipants = [
    {
      id: appData.participants.length + 1,
      name: "New Participant 1",
      email: "newp1@example.com",
      phone: "+1234567892",
      eventId: parseInt(eventId),
      certificateGenerated: false,
      emailSent: false,
      downloaded: false
    }
  ];
  
  appData.participants.push(...newParticipants);
  event.participantCount += newParticipants.length;
  
  if (hasPermission(currentUser, 'participants')) {
    loadParticipantsManagement();
  }
  loadDashboard();
  showToast(`${newParticipants.length} participants uploaded successfully!`, 'success');
}

// Initialize Application
function initializeApp() {
  console.log('Initializing CertiPortal application...');
  
  setTimeout(() => {
    hideLoading();
  }, 500);
  
  loadEventOptions();
  setupEventListeners();
  
  console.log('Application initialized successfully');
}

function setupEventListeners() {
  console.log('Setting up event listeners...');
  
  // Landing page handlers
  const adminLoginBtn = document.getElementById('admin-login-btn');
  if (adminLoginBtn) {
    adminLoginBtn.addEventListener('click', function(e) {
      e.preventDefault();
      openLoginModal();
    });
  }
  
  const verificationForm = document.getElementById('verification-form');
  if (verificationForm) {
    verificationForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const eventId = document.getElementById('event-select').value;
      
      if (email && eventId) {
        verifyCertificate(email, eventId);
      } else {
        showToast('Please fill in all fields', 'error');
      }
    });
  }
  
  // Login modal handlers
  const closeLoginModalBtn = document.getElementById('close-login-modal');
  if (closeLoginModalBtn) {
    closeLoginModalBtn.addEventListener('click', function(e) {
      e.preventDefault();
      closeLoginModal();
    });
  }
  
  const loginModal = document.getElementById('login-modal');
  if (loginModal) {
    loginModal.addEventListener('click', function(e) {
      if (e.target.classList.contains('login-modal-overlay')) {
        closeLoginModal();
      }
    });
  }
  
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeLoginModal();
    }
  });
  
  // Tab switching
  document.querySelectorAll('.login-tab').forEach(tab => {
    tab.addEventListener('click', function(e) {
      e.preventDefault();
      const tabName = this.dataset.tab;
      switchLoginTab(tabName);
    });
  });
  
  // Form submissions
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      handleLogin(email, password);
    });
  }
  
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const name = document.getElementById('signup-name').value;
      const email = document.getElementById('signup-email').value;
      const password = document.getElementById('signup-password').value;
      const confirmPassword = document.getElementById('signup-confirm').value;
      handleSignup(name, email, password, confirmPassword);
    });
  }
  
  const magicForm = document.getElementById('magic-form');
  if (magicForm) {
    magicForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const email = document.getElementById('magic-email').value;
      handleMagicLink(email);
    });
  }
  
  // OAuth buttons
  const googleLoginBtn = document.getElementById('google-login-btn');
  if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', function(e) {
      e.preventDefault();
      currentUser = adminAccounts[0];
      simulateLogin('Google');
    });
  }
  
  const githubLoginBtn = document.getElementById('github-login-btn');
  if (githubLoginBtn) {
    githubLoginBtn.addEventListener('click', function(e) {
      e.preventDefault();
      currentUser = adminAccounts[0];
      simulateLogin('GitHub');
    });
  }
  
  // Admin navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      const page = this.dataset.page;
      
      showAdminSection(page);
      
      switch(page) {
        case 'dashboard':
          loadDashboard();
          break;
        case 'events':
          if (hasPermission(currentUser, 'events')) {
            loadEventsManagement();
          }
          break;
        case 'participants':
          if (hasPermission(currentUser, 'participants')) {
            loadParticipantsManagement();
          }
          break;
        case 'analytics':
          if (hasPermission(currentUser, 'analytics')) {
            loadAnalytics();
          }
          break;
      }
    });
  });
  
  // Logout handler
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      logout();
    });
  }
  
  // Modal handlers
  const createEventBtn = document.getElementById('create-event-btn');
  if (createEventBtn) {
    createEventBtn.addEventListener('click', function(e) {
      e.preventDefault();
      openModal('create-event-modal');
    });
  }
  
  const uploadParticipantsBtn = document.getElementById('upload-participants-btn');
  if (uploadParticipantsBtn) {
    uploadParticipantsBtn.addEventListener('click', function(e) {
      e.preventDefault();
      openModal('upload-csv-modal');
    });
  }
  
  // Generation handler
  const generateCertificatesBtn = document.getElementById('generate-certificates-btn');
  if (generateCertificatesBtn) {
    generateCertificatesBtn.addEventListener('click', function(e) {
      e.preventDefault();
      const eventId = document.getElementById('generation-event-select').value;
      if (eventId) {
        generateCertificates(eventId);
      } else {
        showToast('Please select an event', 'error');
      }
    });
  }
  
  // Export handler
  const exportReportBtn = document.getElementById('export-report-btn');
  if (exportReportBtn) {
    exportReportBtn.addEventListener('click', function(e) {
      e.preventDefault();
      exportReport();
    });
  }
  
  // Modal close handlers
  document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const modal = this.closest('.modal');
      if (modal) {
        modal.classList.add('hidden');
      }
    });
  });
  
  // Form handlers
  const createEventForm = document.getElementById('create-event-form');
  if (createEventForm) {
    createEventForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const eventName = document.getElementById('event-name').value;
      const eventTemplate = document.getElementById('event-template').files[0];
      
      createEvent({ name: eventName, template: eventTemplate });
      closeModal('create-event-modal');
      this.reset();
    });
  }
  
  const uploadCsvForm = document.getElementById('upload-csv-form');
  if (uploadCsvForm) {
    uploadCsvForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const eventId = document.getElementById('csv-event-select').value;
      const csvFile = document.getElementById('csv-file').files[0];
      
      if (eventId && csvFile) {
        uploadParticipants(eventId, csvFile);
        closeModal('upload-csv-modal');
        this.reset();
      }
    });
  }
  
  // Modal background click to close
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
      if (e.target === this) {
        this.classList.add('hidden');
      }
    });
  });
  
  console.log('Event listeners set up successfully');
}

// Make functions global for onclick handlers
window.downloadCertificate = downloadCertificate;
window.editEvent = editEvent;
window.viewEvent = viewEvent;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}