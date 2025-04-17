// 初始化Supabase客户端
const SUPABASE_URL = 'https://wyquovvgkyccfywxdden.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5cXVvdnZna3ljY2Z5d3hkZGVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2MDcwMjIsImV4cCI6MjA2MDE4MzAyMn0.ldBWtZmsuo4uaNF01y6MUbUefOKtgUAmqBj-xTRimkc';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// DOM元素
const uploadButton = document.getElementById('upload-button');
const fileInput = document.getElementById('image');
const descriptionInput = document.getElementById('description');
const gallery = document.getElementById('gallery');
const progressBar = document.createElement('div');
progressBar.style.height = '4px';
progressBar.style.background = '#3b82f6';
progressBar.style.width = '0%';
progressBar.style.transition = 'width 0.3s';
uploadButton.after(progressBar);

// 上传功能
uploadButton.addEventListener('click', async (e) => {
  e.preventDefault();
  
  try {
    // 验证输入
    if (!fileInput.files[0]) {
      throw new Error('请选择要上传的图片');
    }
    
    const file = fileInput.files[0];
    const description = descriptionInput.value.trim() || '未添加描述';
    
    // 显示加载状态
    uploadButton.disabled = true;
    uploadButton.textContent = '上传中...';
    
    // 上传进度模拟（实际进度需要分块上传API）
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress = Math.min(progress + 10, 90);
      progressBar.style.width = `${progress}%`;
    }, 300);

    // 1. 上传到Supabase存储
    const fileName = `${Date.now()}-${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('images')
      .upload(`public/${fileName}`, file);

    clearInterval(progressInterval);
    
    if (uploadError) {
      throw new Error(`上传失败: ${uploadError.message}`);
    }

    // 2. 获取公开URL
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(uploadData.path);

    // 3. 保存到数据库
    const { error: dbError } = await supabase
      .from('images')
      .insert([{
        url: publicUrl,
        description,
        metadata: {
          size: file.size,
          type: file.type,
          uploaded_at: new Date().toISOString()
        }
      }]);

    if (dbError) {
      throw new Error(`保存记录失败: ${dbError.message}`);
    }

    // 更新UI
    progressBar.style.width = '100%';
    setTimeout(() => progressBar.style.width = '0%', 1000);
    showAlert('上传成功!', 'success');
    loadImages();
    
  } catch (error) {
    console.error('上传错误:', error);
    showAlert(error.message, 'error');
    progressBar.style.width = '0%';
  } finally {
    uploadButton.disabled = false;
    uploadButton.textContent = '上传';
  }
});

// 图片加载功能
async function loadImages() {
  try {
    gallery.innerHTML = '<p>加载中...</p>';
    
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .order('metadata->uploaded_at', { ascending: false });

    if (error) throw error;

    if (data.length === 0) {
      gallery.innerHTML = '<p>暂无图片，请上传第一张</p>';
      return;
    }

    gallery.innerHTML = data.map(image => `
      <div class="image-card">
        <img src="${image.url}" 
             alt="${image.description}" 
             loading="lazy"
             onerror="this.src='https://placehold.co/600x400?text=图片加载失败'">
        <div class="image-info">
          <p>${image.description}</p>
          <small>${formatDate(image.metadata.uploaded_at)} • ${formatFileSize(image.metadata.size)}</small>
        </div>
      </div>
    `).join('');
    
  } catch (error) {
    console.error('加载错误:', error);
    gallery.innerHTML = `<p class="error">加载失败: ${error.message}</p>`;
  }
}

// 辅助函数
function showAlert(message, type = 'error') {
  const alertBox = document.createElement('div');
  alertBox.textContent = message;
  alertBox.style.position = 'fixed';
  alertBox.style.top = '20px';
  alertBox.style.right = '20px';
  alertBox.style.padding = '10px 20px';
  alertBox.style.borderRadius = '4px';
  alertBox.style.color = 'white';
  alertBox.style.backgroundColor = type === 'error' ? '#ef4444' : '#10b981';
  alertBox.style.zIndex = '1000';
  document.body.appendChild(alertBox);
  
  setTimeout(() => {
    alertBox.style.opacity = '0';
    setTimeout(() => alertBox.remove(), 300);
  }, 3000);
}

function formatDate(isoString) {
  return new Date(isoString).toLocaleString();
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

// 初始化页面
document.addEventListener('DOMContentLoaded', () => {
  // 测试Supabase连接
  supabase.auth.getSession().then(({ data: { session } }) => {
    console.log('当前会话:', session);
  });
  
  loadImages();
});

// 添加样式
const style = document.createElement('style');
style.textContent = `
  #gallery {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 20px;
    margin-top: 20px;
  }
  
  .image-card {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
    transition: transform 0.2s;
  }
  
  .image-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  }
  
  .image-card img {
    width: 100%;
    height: 200px;
    object-fit: cover;
  }
  
  .image-info {
    padding: 12px;
  }
  
  .image-info p {
    margin: 0 0 8px;
    font-size: 16px;
  }
  
  .image-info small {
    color: #6b7280;
    font-size: 12px;
  }
  
  .error {
    color: #ef4444;
    padding: 20px;
    text-align: center;
  }
`;
document.head.appendChild(style);