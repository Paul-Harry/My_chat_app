import Avatar from '../../assets/avatar.svg'
import React, { useRef } from 'react'
import Input from '../../components/input'
import { useState } from 'react'
import { useEffect } from 'react'
import { io } from 'socket.io-client'


const Dashboard = () => {

  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user:detail')))
  const [conversations, setConversations] = useState([])
  const [messages, setMessages] = useState({})
  const [message, setMessage] = useState('')
  const [users, setUsers] = useState([])
  const [socket, setSocket] = useState(null)
  const messageRef = useRef(null)


  useEffect(() => {
    setSocket(io('https://my-chat-app-uliy.onrender.com'))
  }, [])

  useEffect(() => {
    socket?.emit('addUser', user?.id);
    socket?.on('getUsers', (users) => {
      console.log('activeUsers : >>', users);
    })
    socket?.on('getMessage', data => {
      console.log('data :>> ', data);
      setMessages((prev) => ({
        ...prev,
        messages: [...prev.messages, { user: data.user, message: data.message }],
      }))
    })
  }, [socket])
  //console.log('user :>> ', user);
  //console.log('conversations :>> ', conversations);
  //console.log('messages :>> ', messages);
  //console.log('users :>> ', users);

  useEffect(() => {
    messageRef?.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages?.messages])

  useEffect(() => {
    const loggedInUser = JSON.parse(localStorage.getItem('user:detail'))

    const fetchConversations = async () => {
      const res = await fetch(`https://my-chat-app-uliy.onrender.com/api/conversations/${loggedInUser?.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      const resData = await res.json()
      setConversations(resData)
    }
    fetchConversations()
  }, [])

  useEffect(() => {
    const fetchUsers = async () => {
      const res = await fetch(`https://my-chat-app-uliy.onrender.com/api/users/${user?.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      const resData = await res.json()
      setUsers(resData)
    }
    fetchUsers()
  }, [])

  const fetchMessages = async (conversationId, receiver) => {
    const res = await fetch(`https://my-chat-app-uliy.onrender.com/api/message/${conversationId}?senderId=${user?.id}&&receiverId=${receiver?.receiverId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    const resData = await res.json()
    console.log('resData :>> ', resData);
    setMessages({ messages: resData, receiver, conversationId })
  }

  const sendMessage = async (e) => {
    socket?.emit('sendMessage', {
      senderId: user?.id,
      receiverId: messages?.receiver?.receiverId,
      message,
      conversationId: messages?.conversationId
    });
    //console.log('SendMessage :>> ', message, messages?.conversationId, user?.id, messages?.receiver?.receiverId);
    const res = await fetch(`https://my-chat-app-uliy.onrender.com/api/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversationId: messages?.conversationId,
        senderId: user?.id, message,
        receiverId: messages?.receiver?.receiverId
      })
    });
    setMessage('')
  }

  return (
    <div className='w-screen flex'>
      <div className='w-[25%] h-screen bg-secondary overflow-scroll'>
        <div className='flex items-center my-8 mx-14'>
          <div> <img src={Avatar} width={75} height={75} className='border border-primary p-[2px] rounded-full' /></div>
          <div className='ml-8'>
            <h3 className='text-2xl'> {user?.fullName} </h3>
            <p className='text-lg font-light'> My account</p>
          </div>
        </div>
        <hr />
        <div className='mx-14 mt-10'>
          <div className='text-primary text-lg'>Messages</div>
          <div>
            {
              conversations.length > 0 ?
                conversations.map(({ conversationId, user }) => {
                  console.log('conversations :>> ', conversations);
                  return (

                    <div className='flex items-center py-8 border-b border-b-gray-300'>
                      <div className='cursor-pointer flex items-center' onClick={() => fetchMessages(conversationId, user)} >
                        <div> <img src={Avatar} width={60} height={60} /></div>
                        <div className='ml-6'>
                          <h3 className='text-lg font-semibold'> {user?.fullName} </h3>
                          <p className='text-sm font-light text-gray-600'> {user?.email} </p>
                        </div>
                      </div>
                    </div>
                  )
                }) : <div className='text-center text-lg font-semibold mt-24'> No conversations </div>
            }
          </div>
        </div>
      </div>
      <div className='w-[50%] h-screen bg-white flex flex-col items-center'>
        {
          messages?.receiver?.fullName &&
          <div className='w-[75%] bg-secondary h-[80px] mt-14 rounded-full flex items-center px-14'>
            <div className='cursor-pointer'><img src={Avatar} width={60} height={60} /></div>

            <div className='ml-6 mr-auto'>

              <h3 className='text-lg'> {messages?.receiver?.fullName} </h3>
              <p className='text-sm font-light text-gray-600'> {messages?.receiver?.email} </p>

            </div>
            <div className='cursor-pointer'>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-linecap="round" stroke-linejoin="round" width="36" height="36" stroke-width="2"> <path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2c-8.072 -.49 -14.51 -6.928 -15 -15a2 2 0 0 1 2 -2"></path> <path d="M15 5h6"></path> <path d="M18.5 7.5l2.5 -2.5l-2.5 -2.5"></path>
              </svg>
            </div>
          </div>
        }


        <div className='h-[75%] w-full overflow-scroll shadow-sm'>
          <div className='p-14'>

            {
              messages?.messages?.length > 0 ?
                messages.messages.map(({ message, user: { id } = {} }) => {
                  return (
                    <>
                      <div className={`max-w-[40%] rounded-b-xl p-4 mb-6 ${id === user?.id ? 'bg-primary text-white rounded-tl-xl ml-auto' : 'bg-secondary rounded-tr-xl'}`}>
                        {message}
                      </div>
                      <div ref={messageRef}></div>
                    </>
                  )
                }) : <div className='text-center text-lg font-semibold mt-24'> No Messages or No Conversation Selected </div>
            }
          </div>
        </div>

        {
          messages?.receiver?.fullName &&
          <div className='p-14 w-full flex items-center'>
            <Input placeholder='Type your message...' value={message} onChange={(e) => setMessage(e.target.value)} className='w-[75%]' inputClassName='p-4 border 0 shadow-md rounded-full bg-light focus: ring-0 focus: border-0 outline-none' />
            <div className={`ml-4 p-4 cursor-pointer bg-light rounded-full ${!message && 'pointer-events-none'}`} onClick={() => sendMessage()}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" width="30" height="30" stroke-width="2"> <path d="M4.698 4.034l16.302 7.966l-16.302 7.966a.503 .503 0 0 1 -.546 -.124a.555 .555 0 0 1 -.12 -.568l2.468 -7.274l-2.468 -7.274a.555 .555 0 0 1 .12 -.568a.503 .503 0 0 1 .546 -.124z"></path> <path d="M6.5 12h14.5"></path> </svg>
            </div>
            <div className={`ml-4 p-4 cursor-pointer bg-light rounded-full ${!message && 'pointer-events-none'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" width="30" height="30" stroke-width="2"> <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"></path> <path d="M9 12h6"></path> <path d="M12 9v6"></path> </svg>
            </div>
          </div>
        }

      </div>
      <div className='w-[25%] h-screen bg-secondary px-8 py-16 overflow-scroll'>
        <div className='text-primary text-lg'>Contacts</div>
        <div>
          {
            users.length > 0 ?
              users.map(({ userId, user }) => {
                console.log('conversations :>> ', conversations);
                return (

                  <div className='flex items-center py-8 border-b border-b-gray-300'>
                    <div className='cursor-pointer flex items-center' onClick={() => fetchMessages('new', user)} >
                      <div> <img src={Avatar} width={60} height={60} /></div>
                      <div className='ml-6'>
                        <h3 className='text-lg font-semibold'> {user?.fullName} </h3>
                        <p className='text-sm font-light text-gray-600'> {user?.email} </p>
                      </div>
                    </div>
                  </div>
                )
              }) : <div className='text-center text-lg font-semibold mt-24'> No conversations </div>
          }
        </div>
      </div>
    </div>
  )
}

export default Dashboard