"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/hooks/useToast";
import { executeCommand } from "@/services/aiAgentService";
import { useSimulationStore } from "../../_stores";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AIChatPanelProps {
  simulationId: string;
}

export default function AIChatPanel({ simulationId }: AIChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! Ask me anything about your simulation.\n\nExamples:\n- Which airport and date is this data from?\n- Show me the process list\n- What's the average passenger arrival time?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // 🆕 Zustand store에서 실시간 시뮬레이션 상태 가져오기
  const airport = useSimulationStore((s) => s.context.airport);
  const date = useSimulationStore((s) => s.context.date);
  const flightSelectedConditions = useSimulationStore((s) => s.flight.selectedConditions);
  const flightTotal = useSimulationStore((s) => s.flight.appliedFilterResult?.total || 0);
  const airlines = useSimulationStore((s) => s.flight.airlines);
  const passengerChartResult = useSimulationStore((s) => s.passenger.chartResult);
  const paxGeneration = useSimulationStore((s) => s.passenger.pax_generation);
  const paxDemographics = useSimulationStore((s) => s.passenger.pax_demographics);
  const paxArrivalPatterns = useSimulationStore((s) => s.passenger.pax_arrival_patterns);
  const processFlow = useSimulationStore((s) => s.process_flow);
  const step1Completed = useSimulationStore((s) => s.workflow.step1Completed);
  const step2Completed = useSimulationStore((s) => s.workflow.step2Completed);
  const currentStep = useSimulationStore((s) => s.workflow.currentStep);

  // Auto scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // 🆕 실시간 시뮬레이션 상태 전송 (전체 passenger 데이터 포함)
      const simulationState = {
        // 기본 정보
        airport: airport || "Not set",
        date: date || "Not set",

        // 항공편 정보
        flight_selected: flightSelectedConditions?.expected_flights?.selected || 0,
        flight_total: flightSelectedConditions?.expected_flights?.total || 0,
        airline_names: airlines ? Object.values(airlines) : [],
        airlines_mapping: airlines || {},  // 코드 → 이름 매핑

        // 승객 정보 (전체 데이터)
        passenger: {
          total: passengerChartResult?.total || 0,
          configured: !!passengerChartResult,

          // 탑승률 (rules 포함)
          pax_generation: paxGeneration || { default: { load_factor: null }, rules: [] },

          // 인구통계 (nationality, profile - rules 포함)
          pax_demographics: paxDemographics || {
            nationality: { available_values: [], default: {}, rules: [] },
            profile: { available_values: [], default: {}, rules: [] }
          },

          // 도착 패턴 (rules 포함)
          pax_arrival_patterns: paxArrivalPatterns || { default: { mean: null, std: null }, rules: [] },

          // 차트 결과 (시간대별 상세 데이터)
          chartResult: passengerChartResult || null,
        },

        // 프로세스 (전체 데이터)
        process_count: processFlow.length,
        process_names: processFlow.map((p) => p.name),
        process_flow: processFlow,  // 전체 process_flow 데이터 (zones, facilities, time_blocks 포함)

        // 워크플로우
        workflow: {
          flights_completed: step1Completed,
          passengers_completed: step2Completed,
          current_step: currentStep,
        },
      };

      const { data } = await executeCommand(simulationId, {
        content: userMessage.content,
        conversation_history: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        simulation_state: simulationState, // 👈 실시간 상태 전달
        model: "gpt-4o-2024-08-06",
        temperature: 0.1,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.success ? data.message : `Error: ${data.error}`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.detail || "Failed to get response from AI.",
        variant: "destructive",
      });

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, an error occurred while fetching the response.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-full flex-col bg-white rounded-b-lg overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.role === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            {/* Avatar */}
            <div
              className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                message.role === "user"
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {message.role === "user" ? (
                <User className="h-4 w-4" />
              ) : (
                <Bot className="h-4 w-4" />
              )}
            </div>

            {/* Message Content */}
            <div
              className={`flex-1 max-w-[80%] rounded-lg px-4 py-3 ${
                message.role === "user"
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-900"
              }`}
            >
              {message.role === "user" ? (
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              ) : (
                <div className="prose prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                </div>
              )}
              <p
                className={`mt-1 text-xs ${
                  message.role === "user"
                    ? "text-primary-200"
                    : "text-gray-400"
                }`}
              >
                {message.timestamp.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
              <span className="text-sm text-gray-600">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1"
            asciiOnly={false}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
