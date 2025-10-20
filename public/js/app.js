// 状态管理
const state = {
  token: localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user')),
  books: [],
  currentPage: 1,
  totalPages: 1,
  currentCategory: 'all',
  searchQuery: ''
};

// DOM元素
const elements = {
  // 导航相关
  loginBtn: document.getElementById('loginBtn'),
  registerBtn: document.getElementById('registerBtn'),
  mobileLoginBtn: document.getElementById('mobileLoginBtn'),
  mobileRegisterBtn: document.getElementById('mobileRegisterBtn'),
  userMenu: document.getElementById('userMenu'),
  userName: document.getElementById('userName'),
  logoutBtn: document.getElementById('logoutBtn'),
  mobileMenuBtn: document.getElementById('mobileMenuBtn'),
  mobileMenu: document.getElementById('mobileMenu'),
  
  // 模态框相关
  loginModal: document.getElementById('loginModal'),
  registerModal: document.getElementById('registerModal'),
  closeLoginModal: document.getElementById('closeLoginModal'),
  closeRegisterModal: document.getElementById('closeRegisterModal'),
  switchToRegister: document.getElementById('switchToRegister'),
  switchToLogin: document.getElementById('switchToLogin'),
  loginForm: document.getElementById('loginForm'),
  registerForm: document.getElementById('registerForm'),
  
  // 书籍相关
  booksGrid: document.getElementById('booksGrid'),
  myBooksGrid: document.getElementById('myBooksGrid'),
  publishForm: document.getElementById('publishForm'),
  categoryBtns: document.querySelectorAll('.category-btn'),
  searchInput: document.getElementById('searchInput'),
  loadMoreBtn: document.getElementById('loadMoreBtn'),
  
  // 统计相关
  bookCount: document.getElementById('bookCount'),
  userCount: document.getElementById('userCount'),
  transactionCount: document.getElementById('transactionCount'),
  categoryCount: document.getElementById('categoryCount'),
  
  // 通知相关
  notification: document.getElementById('notification'),
  notificationIcon: document.getElementById('notificationIcon'),
  notificationMessage: document.getElementById('notificationMessage')
};

// 工具函数 - 显示通知
function showNotification(message, isError = false) {
  elements.notificationMessage.textContent = message;
  elements.notificationIcon.className = `fa mr-2 ${isError ? 'fa-exclamation-circle' : 'fa-check-circle'}`;
  elements.notification.classList.add(isError ? 'bg-red-500' : 'bg-green-500');
  elements.notification.classList.remove('translate-x-full');
  
  setTimeout(() => {
    elements.notification.classList.add('translate-x-full');
    elements.notification.classList.remove('bg-red-500', 'bg-green-500');
  }, 3000);
}

// 工具函数 - 显示模态框
function showModal(modal) {
  modal.classList.remove('opacity-0', 'invisible');
  modal.querySelector('div').classList.remove('scale-95');
  modal.querySelector('div').classList.add('scale-100');
  document.body.style.overflow = 'hidden';
}

// 工具函数 - 隐藏模态框
function hideModal(modal) {
  modal.classList.add('opacity-0', 'invisible');
  modal.querySelector('div').classList.remove('scale-100');
  modal.querySelector('div').classList.add('scale-95');
  document.body.style.overflow = '';
}

// 检查登录状态
function isLoggedIn() {
  return !!state.token;
}

// 更新认证相关UI
function updateAuthUI() {
  if (isLoggedIn()) {
    elements.loginBtn.classList.add('hidden');
    elements.registerBtn.classList.add('hidden');
    elements.mobileLoginBtn.classList.add('hidden');
    elements.mobileRegisterBtn.classList.add('hidden');
    elements.userMenu.classList.remove('hidden');
    elements.userMenu.classList.add('flex');
    elements.userName.textContent = state.user?.name || '用户';
    document.getElementById('my-books').classList.remove('hidden');
    loadMyBooks();
  } else {
    elements.loginBtn.classList.remove('hidden');
    elements.registerBtn.classList.remove('hidden');
    elements.mobileLoginBtn.classList.remove('hidden');
    elements.mobileRegisterBtn.classList.remove('hidden');
    elements.userMenu.classList.add('hidden');
    elements.userMenu.classList.remove('flex');
    document.getElementById('my-books').classList.add('hidden');
  }
}

// 生成书籍卡片HTML
function generateBookCard(book) {
  return `
    <div class="bg-white rounded-xl shadow-sm overflow-hidden card-hover">
      <div class="h-48 bg-gray-100 flex items-center justify-center">
        <i class="fa fa-book text-6xl text-gray-300"></i>
      </div>
      <div class="p-5">
        <div class="text-sm text-gray-500 mb-1">${book.category}</div>
        <h3 class="font-bold text-lg mb-2 line-clamp-1">${book.title}</h3>
        <p class="text-gray-600 text-sm mb-3">作者: ${book.author}</p>
        <div class="flex justify-between items-center mb-4">
          <span class="text-primary font-bold text-xl">¥${book.price.toFixed(2)}</span>
          <span class="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm">${book.condition}</span>
        </div>
        <div class="border-t border-gray-100 pt-4 flex justify-between">
          <span class="text-sm text-gray-500">发布者: ${book.userName}</span>
          <button class="view-book-btn text-primary hover:text-primary/80 text-sm font-medium" data-id="${book.id}">
            查看详情 <i class="fa fa-angle-right ml-1"></i>
          </button>
        </div>
        ${isLoggedIn() && book.userId === state.user.id ? `
          <div class="mt-3 pt-3 border-t border-gray-100 flex justify-end">
            <button class="delete-book-btn text-red-500 hover:text-red-600 text-sm" data-id="${book.id}">
              <i class="fa fa-trash mr-1"></i> 删除
            </button>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

// 登录功能
async function login(studentId, password) {
  try {
    const response = await fetch('/api/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ studentId, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || '登录失败');
    }
    
    return data;
  } catch (error) {
    showNotification(error.message, true);
    return null;
  }
}

// 注册功能
async function register(studentId, name, password) {
  try {
    const response = await fetch('/api/users/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ studentId, name, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || '注册失败');
    }
    
    return data;
  } catch (error) {
    showNotification(error.message, true);
    return null;
  }
}

// 获取书籍列表
async function loadBooks(page = 1, append = false) {
  try {
    const response = await fetch(`/api/books?page=${page}&category=${state.currentCategory}&search=${state.searchQuery}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || '加载书籍失败');
    }
    
    state.books = append ? [...state.books, ...data.books] : data.books;
    state.currentPage = page;
    state.totalPages = data.totalPages;
    
    // 更新UI
    if (!append) {
      elements.booksGrid.innerHTML = '';
    }
    
    if (state.books.length === 0) {
      elements.booksGrid.innerHTML = `
        <div class="col-span-full text-center py-12">
          <i class="fa fa-search text-gray-300 text-5xl mb-4"></i>
          <p class="text-gray-500">未找到匹配的书籍</p>
        </div>
      `;
    } else {
      data.books.forEach(book => {
        elements.booksGrid.innerHTML += generateBookCard(book);
      });
      
      // 添加查看详情事件监听
      document.querySelectorAll('.view-book-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const bookId = btn.getAttribute('data-id');
          showBookDetail(bookId);
        });
      });
    }
    
    // 控制加载更多按钮显示
    if (state.currentPage >= state.totalPages) {
      elements.loadMoreBtn.classList.add('hidden');
    } else {
      elements.loadMoreBtn.classList.remove('hidden');
    }
    
    return true;
  } catch (error) {
    elements.booksGrid.innerHTML = `
      <div class="col-span-full text-center py-12">
        <i class="fa fa-exclamation-triangle text-yellow-500 text-5xl mb-4"></i>
        <p class="text-gray-500">${error.message}</p>
      </div>
    `;
    return false;
  }
}

// 获取我的书籍
async function loadMyBooks() {
  if (!isLoggedIn()) return;
  
  try {
    const response = await fetch('/api/books/my', {
      headers: {
        'Authorization': `Bearer ${state.token}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || '加载我的书籍失败');
    }
    
    if (data.books.length === 0) {
      elements.myBooksGrid.innerHTML = `
        <div class="col-span-full text-center py-12">
          <i class="fa fa-book text-gray-300 text-5xl mb-4"></i>
          <p class="text-gray-500">你还没有发布任何书籍</p>
          <a href="#publish" class="inline-block mt-4 btn-primary">
            发布书籍 <i class="fa fa-plus ml-1"></i>
          </a>
        </div>
      `;
    } else {
      elements.myBooksGrid.innerHTML = '';
      data.books.forEach(book => {
        elements.myBooksGrid.innerHTML += generateBookCard(book);
      });
      
      // 添加删除事件监听
      document.querySelectorAll('.delete-book-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const bookId = btn.getAttribute('data-id');
          if (confirm('确定要删除这本书吗？')) {
            await deleteBook(bookId);
            loadMyBooks();
            loadBooks(1);
          }
        });
      });
    }
  } catch (error) {
    elements.myBooksGrid.innerHTML = `
      <div class="col-span-full text-center py-12">
        <i class="fa fa-exclamation-triangle text-yellow-500 text-5xl mb-4"></i>
        <p class="text-gray-500">${error.message}</p>
      </div>
    `;
  }
}

// 发布书籍
async function publishBook(bookData) {
  if (!isLoggedIn()) {
    showNotification('请先登录', true);
    showModal(elements.loginModal);
    return null;
  }
  
  try {
    const response = await fetch('/api/books', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
      },
      body: JSON.stringify(bookData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || '发布书籍失败');
    }
    
    return data;
  } catch (error) {
    showNotification(error.message, true);
    return null;
  }
}

// 删除书籍
async function deleteBook(bookId) {
  if (!isLoggedIn()) return false;
  
  try {
    const response = await fetch(`/api/books/${bookId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${state.token}`
      }
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || '删除书籍失败');
    }
    
    showNotification('书籍已删除');
    return true;
  } catch (error) {
    showNotification(error.message, true);
    return false;
  }
}

// 显示书籍详情
function showBookDetail(bookId) {
  const book = state.books.find(b => b.id == bookId);
  if (!book) return;
  
  // 这里可以实现书籍详情模态框
  alert(`
    书名: ${book.title}
    作者: ${book.author}
    分类: ${book.category}
    价格: ¥${book.price.toFixed(2)}
    新旧程度: ${book.condition}
    联系方式: ${book.contact}
    发布者: ${book.userName}
  `);
}

// 获取统计数据
async function loadStats() {
  try {
    const response = await fetch('/api/stats');
    const data = await response.json();
    
    if (response.ok) {
      elements.bookCount.textContent = data.bookCount;
      elements.userCount.textContent = data.userCount;
      elements.transactionCount.textContent = data.transactionCount;
      elements.categoryCount.textContent = data.categoryCount;
    }
  } catch (error) {
    console.error('加载统计数据失败:', error);
  }
}

// 事件监听 - 登录表单提交
elements.loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const studentId = document.getElementById('loginStudentId').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  
  if (!studentId || !password) {
    showNotification('请填写完整信息', true);
    return;
  }
  
  const result = await login(studentId, password);
  
  if (result && result.success) {
    state.token = result.token;
    state.user = result.user;
    localStorage.setItem('token', result.token);
    localStorage.setItem('user', JSON.stringify(result.user));
    
    updateAuthUI();
    hideModal(elements.loginModal);
    showNotification('登录成功，欢迎回来！');
    elements.loginForm.reset();
  }
});

// 事件监听 - 注册表单提交
elements.registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const studentId = document.getElementById('registerStudentId').value.trim();
  const name = document.getElementById('registerName').value.trim();
  const password = document.getElementById('registerPassword').value.trim();
  
  if (!studentId || !name || !password) {
    showNotification('请填写完整信息', true);
    return;
  }
  
  const result = await register(studentId, name, password);
  
  if (result && result.success) {
    state.token = result.token;
    state.user = result.user;
    localStorage.setItem('token', result.token);
    localStorage.setItem('user', JSON.stringify(result.user));
    
    updateAuthUI();
    hideModal(elements.registerModal);
    showNotification('注册成功，欢迎使用！');
    elements.registerForm.reset();
  }
});

// 事件监听 - 发布书籍表单提交
elements.publishForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const bookData = {
    title: document.getElementById('title').value.trim(),
    author: document.getElementById('author').value.trim(),
    category: document.getElementById('category').value,
    price: parseFloat(document.getElementById('price').value),
    condition: document.getElementById('condition').value,
    contact: document.getElementById('contact').value.trim()
  };
  
  // 简单验证
  if (!bookData.title || !bookData.author || !bookData.category || !bookData.price || !bookData.condition || !bookData.contact) {
    showNotification('请填写完整信息', true);
    return;
  }
  
  const result = await publishBook(bookData);
  
  if (result && result.success) {
    showNotification('书籍发布成功！');
    elements.publishForm.reset();
    loadBooks(1); // 重新加载书籍列表
  }
});

// 事件监听 - 分类筛选
elements.categoryBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    // 更新按钮样式
    elements.categoryBtns.forEach(b => {
      b.classList.remove('bg-primary', 'text-white');
      b.classList.add('bg-gray-200', 'hover:bg-gray-300');
    });
    btn.classList.remove('bg-gray-200', 'hover:bg-gray-300');
    btn.classList.add('bg-primary', 'text-white');
    
    // 更新状态并重新加载书籍
    state.currentCategory = btn.getAttribute('data-category');
    loadBooks(1);
  });
});

// 事件监听 - 搜索
elements.searchInput.addEventListener('input', (e) => {
  state.searchQuery = e.target.value.trim();
  loadBooks(1);
});

// 事件监听 - 加载更多
elements.loadMoreBtn.addEventListener('click', () => {
  loadBooks(state.currentPage + 1, true);
});

// 事件监听 - 登出
elements.logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  state.token = null;
  state.user = null;
  updateAuthUI();
  showNotification('已成功退出登录');
  loadBooks(1);
});

// 事件监听 - 模态框切换
elements.loginBtn.addEventListener('click', () => showModal(elements.loginModal));
elements.registerBtn.addEventListener('click', () => showModal(elements.registerModal));
elements.mobileLoginBtn.addEventListener('click', () => showModal(elements.loginModal));
elements.mobileRegisterBtn.addEventListener('click', () => showModal(elements.registerModal));
elements.closeLoginModal.addEventListener('click', () => hideModal(elements.loginModal));
elements.closeRegisterModal.addEventListener('click', () => hideModal(elements.registerModal));
elements.switchToRegister.addEventListener('click', () => {
  hideModal(elements.loginModal);
  setTimeout(() => showModal(elements.registerModal), 300);
});
elements.switchToLogin.addEventListener('click', () => {
  hideModal(elements.registerModal);
  setTimeout(() => showModal(elements.loginModal), 300);
});

// 事件监听 - 移动端菜单
elements.mobileMenuBtn.addEventListener('click', () => {
  if (elements.mobileMenu.classList.contains('invisible')) {
    elements.mobileMenu.classList.remove('opacity-0', 'invisible', '-translate-y-full');
    elements.mobileMenu.classList.add('opacity-100', 'visible', 'translate-y-0');
  } else {
    elements.mobileMenu.classList.add('opacity-0', 'invisible', '-translate-y-full');
    elements.mobileMenu.classList.remove('opacity-100', 'visible', 'translate-y-0');
  }
});

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  updateAuthUI();
  loadBooks(1);
  loadStats();
  
  // 平滑滚动
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 80,
          behavior: 'smooth'
        });
        
        // 关闭移动菜单
        if (!elements.mobileMenu.classList.contains('invisible')) {
          elements.mobileMenu.classList.add('opacity-0', 'invisible', '-translate-y-full');
          elements.mobileMenu.classList.remove('opacity-100', 'visible', 'translate-y-0');
        }
      }
    });
  });
});