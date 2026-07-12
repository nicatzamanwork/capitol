import { useState } from "react";
import { postChatMessage } from "../api/aiClient";

export const useChat = (initialFinancials) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async (input) => {
    setMessages((prev) => [...prev, { role: "user", text: input }]);
    setLoading(true);

    try {
      const { data } = await postChatMessage({
        message: input,
        userFinancials: initialFinancials,
      });
      setMessages((prev) => [...prev, { role: "ai", text: data.reply }]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return { messages, loading, sendMessage };
};
