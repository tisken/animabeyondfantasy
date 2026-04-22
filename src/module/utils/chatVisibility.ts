declare const game: any;
declare const ChatMessage: any;

interface ChatVisibilityOptions {
  rollMode: string;
  whisper?: string[];
  blind?: boolean;
}

export function getChatVisibilityOptions(): ChatVisibilityOptions {
  const mode: string = game.settings.get('core', 'rollMode') ?? 'publicroll';
  const vis: ChatVisibilityOptions = { rollMode: mode };
  if (mode === 'gmroll') {
    vis.whisper = ChatMessage.getWhisperRecipients('GM').map((u: any) => u.id);
  } else if (mode === 'blindroll') {
    vis.whisper = ChatMessage.getWhisperRecipients('GM').map((u: any) => u.id);
    vis.blind = true;
  } else if (mode === 'selfroll') {
    vis.whisper = [game.user.id];
  }
  return vis;
}
