import { useContext } from 'react'
import { ChatContext } from '../context/chat-context'

export const useChat = () => useContext(ChatContext)
