const express = require('express')
const dotenv = require('dotenv')
const multer = require('multer')
const fs = require('fs')
const path = require('path')

const googleGenAI = require('@google/generative-ai')
const GoogleGenerativeAI = googleGenAI.GoogleGenerativeAI

dotenv.config()
const app = express()
app.use(express.json())

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'models/gemini-2.0-flash'});

const upload = multer({ dest: 'uploads/'})

app.post('/generate-text', async (req, res) => {
    const { prompt } = req.body

    try {
        const result = await model.generateContent (prompt)
        const response = await result.response
        res.json({ output response.text()})
    } catch (error) {
        res.status(500).json({ error: error.message})
    }
})

const imageToGenerativePart = (filePath) => ({
    inlineData: {
      data: fs.readFileSync(filePath).toString('base64'),
      mimeType: 'image/png',
    },
})

app.post('/generate-from-image', upload.single('image'), async (req, res) => {
    const prompt = req.body.prompt || "Describe the image"
    const image = imageToGenerativePart(req.file.path)

    try {
        const result = await model.generateContent([prompt, image])
        const response = await result.response
        res.json({ output: response.text() })
    } catch (error) {
        res.status(500).json({error: error.message})
    }
})

app.post('/generate-from-document',
    upload.single('document'),
    async (req, res) => {
        const filePath = req.file.path
        const buffer = fs.readFileSync(filePath)
        const base64Data = buffer.toString('base64')
        const mimetype = req.file.mimetype

        try {
            const documentPart = {
                inlineData: { 
                    data: base64Data, 
                    mimetype: mimetype },
            }

            const result = await model.generateContent(['Analyze this document', documentPart])
            const response = await result.response
            res.json({ output: response.text() })
        } catch (error) {
            res.status(500).json({ error: error.message });
        } 
    })

app.post('/generate-from-audio', upload.single('audio'), async (req, res) => {
    const audioBuffer = fs.readFileSync(req.file.path)
    const base64Audio = audioBuffer.toString('base64')
    const audioPart = {
        inlineData: {
            data: base64Audio,
            mimetype: 'audio/mpeg',
        }
    }

    try {
        const result = model.generateContent([
            'Transcribe this audio: ',
            audioPart
        ])
        const response = await result.response
        console.log(result)
        res.json({ output: response.text()})
    } catch (error) {
        res.status(500).json({error: error.message})
    }
})

const PORT = 3000
app.listen(PORT, () => {
    console.log(`Gemini app is running on port: ${PORT}`)
})