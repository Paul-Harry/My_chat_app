const express = require('express');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

// DB connection
require('./db/connection');

// Models
const Users = require('./models/Users');
const Conversations = require('./models/Conversations');
const Messages = require('./models/Messages');

const app = express();
const server = http.createServer(app);

// ⚠️ Utilise le port fourni par Render
const port = process.env.PORT || 8000;

// CORS
app.use(cors({
  origin: 'https://my-chat-app-git-master-paul-harrys-projects.vercel.app',
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: 'https://my-chat-app-git-master-paul-harrys-projects.vercel.app',
    methods: ['GET', 'POST']
  }
});

let users = [];

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('addUser', (userId) => {
    const isUserExist = users.find(user => user.userId === userId);
    if (!isUserExist) {
      users.push({ userId, socketId: socket.id });
      io.emit('getUsers', users);
    }
  });

  socket.on('sendMessage', async ({ senderId, receiverId, message, conversationId }) => {
    const receiver = users.find(user => user.userId === receiverId);
    const sender = users.find(user => user.userId === senderId);
    const user = await Users.findById(senderId);

    const messageData = {
      senderId,
      message,
      conversationId,
      receiverId,
      user: { id: user._id, email: user.email, fullName: user.fullName }
    };

    if (receiver) {
      io.to(receiver.socketId).to(sender.socketId).emit('getMessage', messageData);
    } else {
      io.to(sender.socketId).emit('getMessage', messageData);
    }
  });

  socket.on('disconnect', () => {
    users = users.filter(user => user.socketId !== socket.id);
    io.emit('getUsers', users);
  });
});

// Routes
app.get('/', (req, res) => res.send('Welcome to Chat App Backend'));

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).send('Please fill all fields');
    }

    const isAlreadyExist = await Users.findOne({ email });
    if (isAlreadyExist) return res.status(400).send('User already exists');

    const hashedPassword = await bcryptjs.hash(password, 10);
    const newUser = new Users({ fullName, email, password: hashedPassword });
    await newUser.save();

    return res.status(200).send('User created successfully');
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).send('Server error');
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).send('Please fill all fields');

    const user = await Users.findOne({ email });
    if (!user) return res.status(400).send('Incorrect email or password');

    const isValid = await bcryptjs.compare(password, user.password);
    if (!isValid) return res.status(400).send('Incorrect email or password');

    const payload = { userId: user._id, email: user.email };
    const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || 'THIS_IS_MY_SECRET_KEY';

    jwt.sign(payload, JWT_SECRET_KEY, { expiresIn: 84600 }, async (err, token) => {
      if (err) throw err;

      await Users.updateOne({ _id: user._id }, { $set: { token } });
      return res.status(200).json({
        user: { id: user._id, email: user.email, fullName: user.fullName },
        token
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).send('Server error');
  }
});

// Create conversation
app.post('/api/conversations', async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;
    const newConversation = new Conversations({ members: [senderId, receiverId] });
    await newConversation.save();
    res.status(200).send('Conversation created successfully');
  } catch (error) {
    console.error('Conversation error:', error);
    res.status(500).send('Server error');
  }
});

// Get conversations
app.get('/api/conversations/:userId', async (req, res) => {
  try {
    const conversations = await Conversations.find({ members: { $in: [req.params.userId] } });
    const data = await Promise.all(conversations.map(async conv => {
      const receiverId = conv.members.find(m => m !== req.params.userId);
      const user = await Users.findById(receiverId);
      return {
        user: { receiverId: user._id, email: user.email, fullName: user.fullName },
        conversationId: conv._id
      };
    }));
    res.status(200).json(data);
  } catch (error) {
    console.error('Get conv error:', error);
    res.status(500).send('Server error');
  }
});

// Send message
app.post('/api/message', async (req, res) => {
  try {
    const { conversationId, senderId, message, receiverId } = req.body;

    if (!senderId || !message) return res.status(400).send('Please fill all required fields');

    if (conversationId === 'new' && receiverId) {
      const newConversation = new Conversations({ members: [senderId, receiverId] });
      await newConversation.save();
      const newMessage = new Messages({ conversationId: newConversation._id, senderId, message });
      await newMessage.save();
      return res.status(200).send('Message sent successfully');
    }

    if (!conversationId) return res.status(400).send('Missing conversation ID');

    const newMessage = new Messages({ conversationId, senderId, message });
    await newMessage.save();
    res.status(200).send('Message sent successfully');
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).send('Server error');
  }
});

// Get messages
app.get('/api/message/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;

    const fetchMessages = async (id) => {
      const messages = await Messages.find({ conversationId: id });
      const data = await Promise.all(messages.map(async (msg) => {
        const user = await Users.findById(msg.senderId);
        return {
          user: { id: user._id, email: user.email, fullName: user.fullName },
          message: msg.message
        };
      }));
      res.status(200).json(data);
    };

    if (conversationId === 'new') {
      const conv = await Conversations.find({
        members: { $all: [req.query.senderId, req.query.receiverId] }
      });
      return conv.length ? fetchMessages(conv[0]._id) : res.status(200).json([]);
    }

    fetchMessages(conversationId);
  } catch (error) {
    console.error('Get message error:', error);
    res.status(500).send('Server error');
  }
});

// Get all users except one
app.get('/api/users/:userId', async (req, res) => {
  try {
    const users = await Users.find({ _id: { $ne: req.params.userId } });
    const data = users.map(user => ({
      user: {
        receiverId: user._id,
        email: user.email,
        fullName: user.fullName
      }
    }));
    res.status(200).json(data);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).send('Server error');
  }
});

// Start server
server.listen(port, () => {
  console.log('Server is running on port ' + port);
});
