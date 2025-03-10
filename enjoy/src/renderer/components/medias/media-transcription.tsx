import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
  Skeleton,
  ScrollArea,
  Button,
  PingPoint,
} from "@renderer/components/ui";
import React, { useEffect, useContext, useState } from "react";
import { t } from "i18next";
import { LoaderIcon, CheckCircleIcon, MicIcon } from "lucide-react";
import {
  DbProviderContext,
  AppSettingsProviderContext,
  AISettingsProviderContext,
} from "@renderer/context";

export const MediaTranscription = (props: {
  transcription: TranscriptionType;
  progress: number;
  transcribe: () => void;
  transcribing: boolean;
  mediaId: string;
  mediaType: "Audio" | "Video";
  mediaName?: string;
  currentSegmentIndex?: number;
  onSelectSegment?: (index: number) => void;
}) => {
  const { addDblistener, removeDbListener } = useContext(DbProviderContext);
  const { whisperConfig } = useContext(AISettingsProviderContext);
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const {
    transcription,
    transcribing,
    progress,
    transcribe,
    mediaId,
    mediaType,
    mediaName,
    currentSegmentIndex,
    onSelectSegment,
  } = props;
  const containerRef = React.createRef<HTMLDivElement>();

  const [recordingStats, setRecordingStats] =
    useState<SegementRecordingStatsType>([]);

  const fetchSegmentStats = async () => {
    if (!mediaId) return;

    EnjoyApp.recordings.groupBySegment(mediaId, mediaType).then((stats) => {
      setRecordingStats(stats);
    });
  };

  useEffect(() => {
    addDblistener(fetchSegmentStats);
    fetchSegmentStats();

    return () => {
      removeDbListener(fetchSegmentStats);
    };
  }, [transcription]);

  useEffect(() => {
    containerRef.current
      ?.querySelector(`#segment-${currentSegmentIndex}`)
      ?.scrollIntoView({
        block: "center",
        inline: "center",
      } as ScrollIntoViewOptions);
  }, [currentSegmentIndex, transcription]);

  if (!transcription)
    return (
      <div className="p-4 w-full">
        <TranscriptionPlaceholder />
      </div>
    );

  return (
    <div
      className="w-full h-full flex flex-col"
      data-testid="media-transcription"
    >
      <div className="mb-4 flex items-cener justify-between">
        <div className="flex items-center space-x-2">
          {transcribing || transcription.state === "processing" ? (
            <>
              <PingPoint colorClassName="bg-yellow-500" />
              <div className="text-sm">
                {whisperConfig.service === "local" && `${progress}%`}
              </div>
            </>
          ) : transcription.state === "finished" ? (
            <CheckCircleIcon className="text-green-500 w-4 h-4" />
          ) : (
            <PingPoint colorClassName="bg-mute" />
          )}
          <span className="capitalize">{t("transcript")}</span>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              disabled={transcribing || transcription.state === "processing"}
              className="capitalize"
            >
              {(transcribing || transcription.state === "processing") && (
                <LoaderIcon className="animate-spin w-4 mr-2" />
              )}
              {transcription.result ? t("regenerate") : t("transcribe")}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("transcribe")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("transcribeAudioConfirmation", {
                  name: mediaName,
                })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={transcribe}>
                {t("transcribe")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {transcription?.result ? (
        <ScrollArea
          ref={containerRef}
          className="flex-1 px-2"
          data-testid="media-transcription-result"
        >
          {transcription.result.map((t, index) => (
            <div
              key={index}
              id={`segment-${index}`}
              className={`py-1 px-2 mb-2 cursor-pointer hover:bg-yellow-400/25 ${
                currentSegmentIndex === index ? "bg-yellow-400/25" : ""
              }`}
              onClick={() => {
                onSelectSegment?.(index);
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs opacity-50">#{index + 1}</span>

                <div className="flex items-center space-x-2">
                  {(recordingStats || []).findIndex(
                    (s) => s.referenceId === index
                  ) !== -1 && <MicIcon className="w-3 h-3 text-sky-500" />}
                  <span className="text-xs opacity-50">
                    {t.timestamps.from.split(",")[0]}
                  </span>
                </div>
              </div>
              <p className="">{t.text}</p>
            </div>
          ))}
        </ScrollArea>
      ) : (
        <TranscriptionPlaceholder />
      )}
    </div>
  );
};

export const TranscriptionPlaceholder = () => {
  return (
    <div className="p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full mb-4" />
      ))}
      <Skeleton className="h-4 w-3/5" />
    </div>
  );
};
