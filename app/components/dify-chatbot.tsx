"use client";

import { useEffect } from "react";

const DIFY_TOKEN = "v6MceBc699WCQuNp";
const DIFY_SCRIPT_URL = "https://udify.app/embed.min.js";
const CHAT_PRIVACY_HINT_ID = "dify-chatbot-privacy-hint";

type DifyWindow = Window & {
  difyChatbotConfig?: {
    token: string;
    inputs: Record<string, never>;
    systemVariables: Record<string, never>;
    userVariables: Record<string, never>;
    dynamicScript: true;
  };
};

function makeBubbleAccessible() {
  const bubble = document.getElementById("dify-chatbot-bubble-button");
  const chatWindow = document.getElementById("dify-chatbot-bubble-window");

  if (!(bubble instanceof HTMLElement)) {
    return;
  }

  const isOpen =
    chatWindow instanceof HTMLElement &&
    window.getComputedStyle(chatWindow).display !== "none";

  bubble.setAttribute(
    "aria-label",
    `${isOpen ? "关闭" : "打开"} Ocean 的聊天助手`,
  );
  bubble.setAttribute("aria-describedby", CHAT_PRIVACY_HINT_ID);
  bubble.setAttribute("aria-expanded", String(isOpen));
  bubble.setAttribute("title", "和 Ocean 的聊天助手聊聊");

  if (chatWindow) {
    bubble.setAttribute("aria-controls", "dify-chatbot-bubble-window");
  }

  if (bubble.tagName === "BUTTON") {
    return;
  }

  bubble.setAttribute("role", "button");
  bubble.setAttribute("tabindex", "0");

  if (bubble.dataset.oceanKeyboardReady === "true") {
    return;
  }

  bubble.dataset.oceanKeyboardReady = "true";
  bubble.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      bubble.click();
    }
  });
}

export function DifyChatbot() {
  useEffect(() => {
    const difyWindow = window as DifyWindow;
    difyWindow.difyChatbotConfig = {
      token: DIFY_TOKEN,
      inputs: {},
      systemVariables: {},
      userVariables: {},
      dynamicScript: true,
    };

    let observedChatWindow: Element | null = null;
    const chatWindowObserver = new MutationObserver(makeBubbleAccessible);
    const observeChatWindowState = () => {
      const chatWindow = document.getElementById(
        "dify-chatbot-bubble-window",
      );

      if (chatWindow === observedChatWindow) {
        return;
      }

      chatWindowObserver.disconnect();
      observedChatWindow = chatWindow;

      if (chatWindow) {
        chatWindowObserver.observe(chatWindow, {
          attributes: true,
          attributeFilter: ["class", "style"],
        });
      }
    };

    const documentObserver = new MutationObserver(() => {
      observeChatWindowState();
      makeBubbleAccessible();
    });
    documentObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    const disconnectObservers = () => {
      documentObserver.disconnect();
      chatWindowObserver.disconnect();
    };
    let disposed = false;
    const handleLoad = () => {
      if (disposed) {
        return;
      }

      observeChatWindowState();
      makeBubbleAccessible();
    };
    const handleError = () => {
      if (!disposed) {
        disconnectObservers();
      }
    };

    const existingScript = document.getElementById(DIFY_TOKEN);
    let script: HTMLScriptElement;

    if (existingScript instanceof HTMLScriptElement) {
      script = existingScript;
      observeChatWindowState();
      makeBubbleAccessible();
    } else {
      script = document.createElement("script");
      script.id = DIFY_TOKEN;
      script.src = DIFY_SCRIPT_URL;
      script.defer = true;
    }

    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });

    if (!existingScript) {
      document.body.appendChild(script);
    }

    return () => {
      disposed = true;
      script.removeEventListener("load", handleLoad);
      script.removeEventListener("error", handleError);
      disconnectObservers();
    };
  }, []);

  return (
    <p className="dify-chatbot-privacy-hint" id={CHAT_PRIVACY_HINT_ID}>
      由 Dify 提供 · 请勿输入敏感信息
    </p>
  );
}
