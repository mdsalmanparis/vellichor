import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import os from 'os'

const execAsync = promisify(exec)

const codeExecutionPlugin = () => ({
  name: 'code-execution',
  configureServer(server: any) {
    server.middlewares.use(async (req: any, res: any, next: any) => {
      if (req.url === '/api/execute' && req.method === 'POST') {
        let body = ''
        req.on('data', (chunk: any) => { body += chunk.toString() })
        req.on('end', async () => {
          try {
            const { language, code } = JSON.parse(body)
            const tempDir = os.tmpdir()
            const fileId = Date.now().toString()
            let stdout = '', stderr = '', image: string | undefined = undefined;

            try {
              if (language === 'python' || language === 'python3') {
                const filePath = path.join(tempDir, `script_${fileId}.py`)
                const plotPath = path.join(tempDir, `plot_${fileId}.png`).replace(/\\/g, '/')
                
                const injectedCode = `
import sys
try:
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    def custom_show(*args, **kwargs):
        plt.savefig('${plotPath}')
    plt.show = custom_show
except ImportError:
    pass

${code}
`
                fs.writeFileSync(filePath, injectedCode)
                const { stdout: out, stderr: err } = await execAsync(`python "${filePath}"`)
                stdout = out; stderr = err;
                
                if (fs.existsSync(plotPath)) {
                  const imageBuffer = fs.readFileSync(plotPath)
                  image = `data:image/png;base64,${imageBuffer.toString('base64')}`
                  try { fs.unlinkSync(plotPath) } catch (e) {}
                }
                try { fs.unlinkSync(filePath) } catch (e) {}
              } else if (language === 'javascript' || language === 'node' || language === 'js') {
                const filePath = path.join(tempDir, `script_${fileId}.js`)
                fs.writeFileSync(filePath, code)
                const { stdout: out, stderr: err } = await execAsync(`node "${filePath}"`)
                stdout = out; stderr = err;
                try { fs.unlinkSync(filePath) } catch (e) {}
              } else if (language === 'bash' || language === 'sh') {
                const filePath = path.join(tempDir, `script_${fileId}.sh`)
                fs.writeFileSync(filePath, code)
                const { stdout: out, stderr: err } = await execAsync(`bash "${filePath}"`)
                stdout = out; stderr = err;
                try { fs.unlinkSync(filePath) } catch (e) {}
              } else {
                stderr = `Unsupported language: ${language}`
              }
            } catch (e: any) {
              stderr = e.stderr || e.message
              stdout = e.stdout || ''
            }

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ stdout, stderr, image }))
          } catch (e: any) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: e.message }))
          }
        })
        return
      }
      
      if (req.method === 'POST' && req.url === '/api/execute-external') {
        let body = ''
        req.on('data', (chunk: any) => { body += chunk.toString() })
        req.on('end', async () => {
          try {
            const { language, code } = JSON.parse(body)
            const tempDir = os.tmpdir()
            const fileId = Date.now().toString()
            
            let command = '';
            let filePath = '';
            
            if (language === 'python' || language === 'python3') {
              filePath = path.join(tempDir, `script_${fileId}.py`)
              let finalCode = code;
              if (finalCode.includes('FastAPI()') && !finalCode.includes('uvicorn.run')) {
                finalCode += `\n\nif __name__ == "__main__":\n    import uvicorn\n    print("\\n🚀 Vellichor Auto-Starting FastAPI Server on http://127.0.0.1:8000")\n    uvicorn.run(app, host="127.0.0.1", port=8000)\n`;
              }
              fs.writeFileSync(filePath, finalCode)
              command = `start "Vellichor Python" cmd.exe /K "python "${filePath}""`
            } else if (language === 'javascript' || language === 'node' || language === 'js') {
              filePath = path.join(tempDir, `script_${fileId}.js`)
              fs.writeFileSync(filePath, code)
              command = `start "Vellichor Node" cmd.exe /K "node "${filePath}""`
            } else if (language === 'bash' || language === 'sh') {
              filePath = path.join(tempDir, `script_${fileId}.sh`)
              fs.writeFileSync(filePath, code)
              command = `start "Vellichor Bash" cmd.exe /K "bash "${filePath}""`
            } else {
              throw new Error(`Unsupported language for external execution: ${language}`);
            }
            
            require('child_process').exec(command, (error: any) => {
               if (error) console.error("External Execution Error:", error);
            });
            
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: true, message: "Launched natively! Check your taskbar for the new console window." }))
          } catch (e: any) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: e.message }))
          }
        })
        return
      }

      next()
    })
  }
})

export default defineConfig({
  plugins: [react(), codeExecutionPlugin()],
})
