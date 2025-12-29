import './MessageBanner.css';

interface MessageBannerProps {
  message: string;
}

export const MessageBanner: React.FC<MessageBannerProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="message-banner" role="alert">
      <span className="message-banner__icon">⚠️</span>
      <span className="message-banner__text">{message}</span>
    </div>
  );
};
