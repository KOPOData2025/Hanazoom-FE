"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { ko } from "date-fns/locale";
import { useAuthStore } from "@/app/utils/auth";
import {
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
} from "lucide-react";

interface AvailabilitySlot {
  startTime: Date;
  endTime: Date;
}

const timeSlots = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
];


const consultationDurations = [
  { label: "30분", value: 30 },
  { label: "45분", value: 45 },
  { label: "60분", value: 60 },
  { label: "90분", value: 90 },
  { label: "120분", value: 120 },
];

export default function PbAvailabilityManager() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [selectedDuration, setSelectedDuration] = useState(30); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");


  const formatToLocalDate = useCallback((date: Date) => {
    const pad = (num: number) => String(num).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate()
    )}`;
  }, []);


  const formatToLocalISO = useCallback((date: Date) => {
    const pad = (num: number) => String(num).padStart(2, "0");
    return (
      `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
        date.getDate()
      )}` +
      `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
        date.getSeconds()
      )}`
    );
  }, []);


  const [existingUnavailableTimes, setExistingUnavailableTimes] = useState<
    string[]
  >([]);
  const [clientBookings, setClientBookings] = useState<
    Array<{
      time: string;
      clientName: string;
      status: string;
      durationMinutes: number;
      consultationType: string;
    }>
  >([]);


  const loadExistingTimeStatus = async (date: Date) => {
    try {
      const dateStr = formatToLocalDate(date);
      const accessToken = useAuthStore.getState().accessToken;

      if (!accessToken) {
        console.warn("액세스 토큰이 없습니다.");
        return;
      }

      const response = await fetch(
        `/api/consultations/pb-time-status?date=${dateStr}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setExistingUnavailableTimes(data.data.unavailableTimes || []);
          setClientBookings(data.data.clientBookings || []);
        } else {
          console.error("시간 상태 조회 API 응답 실패:", data.message);
        }
      } else {
        console.error(
          "시간 상태 조회 HTTP 실패:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("시간 상태 로드 에러:", error);

    }
  };


  useEffect(() => {
    if (selectedDate) {
      loadExistingTimeStatus(selectedDate);
      setSelectedTimes([]); 
    }
  }, [selectedDate]);


  const getTimeBlocksForDuration = (
    startTime: string,
    durationMinutes: number
  ): string[] => {
    const startIndex = timeSlots.indexOf(startTime);
    if (startIndex === -1) return [];

    const blocksNeeded = Math.ceil(durationMinutes / 30); 
    const endIndex = startIndex + blocksNeeded;


    if (endIndex > timeSlots.length) return [];

    return timeSlots.slice(startIndex, endIndex);
  };


  const isValidTimeBlock = (
    startTime: string,
    durationMinutes: number
  ): boolean => {
    const [hours, minutes] = startTime.split(":").map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + durationMinutes;
    const maxEndMinutes = 18 * 60; 

    return endMinutes <= maxEndMinutes;
  };


  const removeUnavailableTime = async (time: string) => {
    if (!selectedDate) return;


    const previousUnavailableTimes = [...existingUnavailableTimes];

    try {
      setIsSubmitting(true);
      setError(""); 

      const dateStr = formatToLocalDate(selectedDate);
      const accessToken = useAuthStore.getState().accessToken;


      setExistingUnavailableTimes((prev) => prev.filter((t) => t !== time));

      const response = await fetch(
        `/api/pb/unavailable-time?date=${dateStr}&time=${time}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSuccess(`${time} 불가능 시간이 해제되었습니다.`);


          setTimeout(async () => {
            await loadExistingTimeStatus(selectedDate);
          }, 100);
        } else {

          setExistingUnavailableTimes(previousUnavailableTimes);
          throw new Error(data.message || "불가능 시간 해제에 실패했습니다.");
        }
      } else {

        setExistingUnavailableTimes(previousUnavailableTimes);
        throw new Error("불가능 시간 해제에 실패했습니다.");
      }
    } catch (err: any) {

      setExistingUnavailableTimes(previousUnavailableTimes);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTimeSelect = (time: string) => {
    setError(""); 
    setSuccess(""); 


    const isClientBooked = clientBookings.some(
      (booking) => booking.time === time
    );
    if (isClientBooked) {
      const booking = clientBookings.find((b) => b.time === time);

      if (booking?.status === "PENDING") {

        setSuccess(
          `${booking.clientName}님의 ${time} 예약 요청이 있습니다. 상담 관리 탭에서 승인/거절을 결정해주세요.`
        );


        return;
      } else {

        let statusMessage = "";
        switch (booking?.status) {
          case "APPROVED":
            statusMessage = "승인된 상담 - 수정할 수 없습니다";
            break;
          case "IN_PROGRESS":
            statusMessage = "진행중인 상담 - 수정할 수 없습니다";
            break;
          case "COMPLETED":
            statusMessage = "완료된 상담 - 수정할 수 없습니다";
            break;
          default:
            statusMessage = `${booking?.status} 상태`;
        }

        setError(
          `${time}은 ${booking?.clientName}님이 예약한 시간입니다. (${statusMessage})`
        );
        return;
      }
    }


    const isExistingUnavailable = existingUnavailableTimes.includes(time);
    if (isExistingUnavailable) {

      removeUnavailableTime(time);
      return;
    }


    if (!isValidTimeBlock(time, selectedDuration)) {
      setError(
        `${time}에서 시작하는 ${selectedDuration}분 상담은 18:00를 넘어갑니다.`
      );
      return;
    }

    const timeBlocks = getTimeBlocksForDuration(time, selectedDuration);


    const hasConflict = timeBlocks.some(
      (block) =>
        clientBookings.some((booking) => booking.time === block) ||
        existingUnavailableTimes.includes(block)
    );

    if (hasConflict) {
      setError(
        `선택한 시간 범위에 이미 예약된 시간이나 불가능한 시간이 포함되어 있습니다.`
      );
      return;
    }

    setSelectedTimes((prev) => {

      const isAlreadySelected = timeBlocks.every((block) =>
        prev.includes(block)
      );

      if (isAlreadySelected) {

        return prev.filter((t) => !timeBlocks.includes(t));
      } else {


        const filteredPrev = prev.filter((t) => !timeBlocks.includes(t));
        return [...filteredPrev, ...timeBlocks].sort();
      }
    });
  };

  const handleSubmit = async () => {
    if (!selectedDate || selectedTimes.length === 0) {
      setError("날짜와 시간을 선택해주세요.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess("");


    const sortedTimes = [...selectedTimes].sort();
    const availableSlots: Array<{ startTime: string; endTime: string }> = [];


    const blocksNeeded = Math.ceil(selectedDuration / 30);

    for (let i = 0; i < sortedTimes.length; i += blocksNeeded) {
      const blockTimes = sortedTimes.slice(i, i + blocksNeeded);


      let isConsecutive = true;
      for (let j = 1; j < blockTimes.length; j++) {
        const prevTime = blockTimes[j - 1];
        const currentTime = blockTimes[j];
        const prevIndex = timeSlots.indexOf(prevTime);
        const currentIndex = timeSlots.indexOf(currentTime);

        if (currentIndex !== prevIndex + 1) {
          isConsecutive = false;
          break;
        }
      }

      if (isConsecutive && blockTimes.length === blocksNeeded) {
        const firstTime = blockTimes[0];
        const [hours, minutes] = firstTime.split(":").map(Number);

        const startTime = new Date(selectedDate);
        startTime.setHours(hours, minutes, 0, 0);
        const endTime = new Date(
          startTime.getTime() + selectedDuration * 60 * 1000
        );

        availableSlots.push({
          startTime: formatToLocalISO(startTime),
          endTime: formatToLocalISO(endTime),
        });
      }
    }

    try {
      const accessToken = useAuthStore.getState().accessToken; 
      if (!accessToken) {
        throw new Error("로그인이 필요합니다.");
      }

      const response = await fetch("/api/pb/availability", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ availableSlots }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(
          `${availableSlots.length}개의 ${selectedDuration}분 상담 불가능 시간이 성공적으로 등록되었습니다.`
        );


        const newUnavailableTimes = selectedTimes.map((time) => time);
        setExistingUnavailableTimes((prev) => [
          ...prev,
          ...newUnavailableTimes,
        ]);
        setSelectedTimes([]);


        if (selectedDate) {
          setTimeout(async () => {
            await loadExistingTimeStatus(selectedDate);
          }, 100);
        }
      } else {
        throw new Error(data.message || "시간 등록에 실패했습니다.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                상담 시간
              </h3>
            </div>
            <select
              value={selectedDuration}
              onChange={(e) => {
                setSelectedDuration(Number(e.target.value));
                setSelectedTimes([]);
                setError("");
              }}
              className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            >
              {consultationDurations.map((duration) => (
                <option key={duration.value} value={duration.value}>
                  {duration.label}
                </option>
              ))}
            </select>
          </div>
        </div>

              <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
                  시간 상태 안내
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-slate-100 dark:bg-slate-600 border border-slate-300 dark:border-slate-500 rounded"></div>
                    <span className="text-slate-600 dark:text-slate-400">
                      선택 가능
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-100 dark:bg-orange-950/50 border border-orange-300 dark:border-orange-700 rounded"></div>
                    <span className="text-slate-600 dark:text-slate-400">
                      새로 선택
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-100 dark:bg-red-950/50 border border-red-300 dark:border-red-700 rounded"></div>
                    <span className="text-slate-600 dark:text-slate-400">
                      기존 불가능
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-100 dark:bg-yellow-950/50 border border-yellow-300 dark:border-yellow-700 rounded"></div>
                    <span className="text-slate-600 dark:text-slate-400">
                      예약 대기중
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-100 dark:bg-blue-950/50 border border-blue-300 dark:border-blue-700 rounded"></div>
                    <span className="text-slate-600 dark:text-slate-400">
                      확정 예약
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {timeSlots.map((time) => {
                  const isValidStart = isValidTimeBlock(time, selectedDuration);
                  const isPartOfSelectedBlock = selectedTimes.includes(time);
                  const isExistingUnavailable =
                    existingUnavailableTimes.includes(time);
                  const clientBooking = clientBookings.find(
                    (booking) => booking.time === time
                  );
                  const isClientBooked = !!clientBooking;


                  let buttonStyle = "";
                  let iconComponent = null;
                  let titleText = "";

                  if (isPartOfSelectedBlock) {

                    buttonStyle =
                      "bg-orange-50 dark:bg-orange-950/30 border-2 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400 shadow-sm";
                    iconComponent = (
                      <XCircle className="w-4 h-4 text-orange-500 dark:text-orange-400" />
                    );
                    titleText = "새로 선택된 불가능 시간";
                  } else if (isExistingUnavailable) {

                    buttonStyle =
                      "bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 shadow-sm hover:bg-red-100 dark:hover:bg-red-950/50";
                    iconComponent = (
                      <XCircle className="w-4 h-4 text-red-500 dark:text-red-400" />
                    );
                    titleText = "기존 불가능 시간 (클릭하여 해제)";
                  } else if (isClientBooked) {

                    if (clientBooking?.status === "PENDING") {

                      buttonStyle =
                        "bg-yellow-50 dark:bg-yellow-950/30 border-2 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400 shadow-sm hover:bg-yellow-100 dark:hover:bg-yellow-950/50";
                      iconComponent = (
                        <AlertCircle className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
                      );
                      titleText = `${clientBooking.clientName}님 예약 대기중 - 클릭하여 상담 관리로 이동`;
                    } else {

                      buttonStyle =
                        "bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 shadow-sm cursor-not-allowed";
                      iconComponent = (
                        <Users className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                      );

                      let statusText = "";
                      switch (clientBooking?.status) {
                        case "APPROVED":
                          statusText = "승인된 상담";
                          break;
                        case "IN_PROGRESS":
                          statusText = "진행중인 상담";
                          break;
                        case "COMPLETED":
                          statusText = "완료된 상담";
                          break;
                        default:
                          statusText = clientBooking?.status || "예약됨";
                      }
                      titleText = `${clientBooking.clientName}님 ${statusText} - 수정할 수 없습니다`;
                    }
                  } else if (isValidStart) {

                    buttonStyle =
                      "bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 hover:border-slate-300 dark:hover:border-slate-500 hover:shadow-sm";
                    iconComponent = (
                      <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    );
                    titleText = "클릭하여 불가능 시간으로 설정";
                  } else {

                    buttonStyle =
                      "bg-slate-25 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-600 cursor-not-allowed";
                    iconComponent = (
                      <XCircle className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                    );
                    titleText = `${time}에서 시작하는 ${selectedDuration}분 상담은 18:00를 넘어갑니다`;
                  }

                  return (
                    <button
                      key={time}
                      onClick={() => handleTimeSelect(time)}
                      disabled={
                        !isValidStart &&
                        !isExistingUnavailable &&
                        !(isClientBooked && clientBooking?.status === "PENDING")
                      }
                      className={`
                        relative p-3 rounded-lg text-sm font-medium transition-all duration-200
                        ${buttonStyle}
                      `}
                      title={titleText}
                    >
                      <div className="flex flex-col items-center gap-1">
                        {iconComponent}
                        <span>{time}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {existingUnavailableTimes.length > 0 && (
                <div className="mt-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="w-full">
                      <p className="font-medium text-red-900 dark:text-red-300 mb-2">
                        기존 불가능 시간 (클릭하여 해제 가능)
                      </p>
                      <div className="text-sm text-red-700 dark:text-red-400">
                        <p className="font-mono">
                          {existingUnavailableTimes.sort().join(", ")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex-1">
          {error && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-4 py-2 rounded-lg">
              <XCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-4 py-2 rounded-lg">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{success}</span>
            </div>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !selectedDate || selectedTimes.length === 0}
          className="
            px-6 py-3 bg-emerald-600 dark:bg-emerald-700 text-white font-semibold rounded-lg
            disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 dark:disabled:text-slate-400 disabled:cursor-not-allowed
            hover:bg-emerald-700 dark:hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800
            transition-all duration-200 shadow-sm hover:shadow-md
            min-w-[200px] flex items-center justify-center gap-2
          "
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>등록 중...</span>
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4" />
              <span>불가능 시간 등록</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
