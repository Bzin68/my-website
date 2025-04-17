const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

exports.handler = async (event) => {
  try {
    // 验证环境变量
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
      throw new Error('缺少Supabase环境变量配置')
    }

    // 初始化客户端
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    )

    // 解析请求体
    const { email, password } = JSON.parse(event.body || '{}')
    if (!email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: '邮箱和密码不能为空' })
      }
    }

    // 执行登录
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error

    return {
      statusCode: 200,
      body: JSON.stringify({
        user: data.user,
        session: data.session
      })
    }

  } catch (error) {
    console.error('登录错误:', error)
    return {
      statusCode: error.status_code || 500,
      body: JSON.stringify({
        error: error.message,
        details: error 
      })
    }
  }
}