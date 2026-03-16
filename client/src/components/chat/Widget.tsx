import { useState, useRef, useEffect } from "react";

// ── Session ID ────────────────────────────────────────────────────────────────
const SESSION_KEY = "ai_support_session_id";
function makeSessionId(): string {
  const id = crypto.randomUUID();
  sessionStorage.setItem(SESSION_KEY, id);
  return id;
}
function getOrCreateSessionId(): string {
  return sessionStorage.getItem(SESSION_KEY) ?? makeSessionId();
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface ChatMessage {
  id: number;
  role: "user" | "bot";
  text: string;
  source?: string | null;
}
interface Settings {
  faqs: boolean;
  leads: boolean;
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 16, stroke = "currentColor", fill = "none", strokeWidth = 2 }: {
  d: string; size?: number; stroke?: string; fill?: string; strokeWidth?: number;
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
    strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const SendIcon  = () => <Icon d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" size={14} />;
const UserIcon  = () => <Icon d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" size={14} />;
const PlusIcon  = () => <Icon d="M12 5v14M5 12h14" size={12} strokeWidth={2.5} />;
// notification-on.svg
const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M9.01298 0.9375C9.09126 0.93752 9.16917 0.952193 9.2415 0.981445C9.31379 1.01071 9.37951 1.05436 9.43485 1.1084C9.49006 1.16237 9.53383 1.22641 9.56376 1.29688C9.59368 1.36741 9.6096 1.44319 9.60966 1.51953V2.42871C10.8542 2.5482 12.0093 3.11452 12.8499 4.01855C13.6906 4.92269 14.1566 6.10009 14.1585 7.32129V7.6543C14.1782 8.73736 14.5143 9.794 15.1292 10.6992L15.678 11.4912C15.9038 11.8307 16.032 12.2235 16.0501 12.6279C16.0681 13.0324 15.9753 13.4346 15.7806 13.792C15.5857 14.1494 15.2964 14.4497 14.9427 14.6611C14.589 14.8725 14.1835 14.9874 13.7688 14.9941H11.136V15.25C11.0656 15.7521 10.8113 16.2128 10.4202 16.5459C10.0292 16.8789 9.52793 17.0624 9.00907 17.0625C8.49004 17.0625 7.9881 16.879 7.59696 16.5459C7.20589 16.2128 6.95161 15.7521 6.88114 15.25V14.9941H4.26493C3.65954 14.9941 3.07875 14.7588 2.65067 14.3408C2.22278 13.9229 1.98184 13.3565 1.98173 12.7656C1.98446 12.2909 2.14039 11.8287 2.42704 11.4453L2.96024 10.7305C3.71188 9.74358 4.11176 8.54328 4.09794 7.31348C4.07572 6.34732 4.35307 5.39728 4.89384 4.58789C5.43464 3.77849 6.21363 3.14773 7.12821 2.77832C7.54143 2.61745 7.97445 2.51038 8.4163 2.45996V1.51953C8.41636 1.44319 8.43228 1.36741 8.4622 1.29688C8.49215 1.22639 8.53585 1.16238 8.5911 1.1084C8.6465 1.05431 8.71209 1.01072 8.78446 0.981445C8.85682 0.95219 8.93467 0.9375 9.01298 0.9375ZM8.0745 15.1182C8.11202 15.3349 8.22699 15.5317 8.39872 15.6738C8.57043 15.8159 8.78794 15.8939 9.01298 15.8945C9.2388 15.8971 9.45783 15.8202 9.63017 15.6777C9.80258 15.5351 9.917 15.3363 9.95146 15.1182V14.9941H8.0745V15.1182ZM9.15556 3.57812C8.61106 3.57526 8.07119 3.67538 7.56571 3.87305C6.88342 4.15083 6.30125 4.62204 5.89579 5.22559C5.4905 5.829 5.27955 6.53726 5.29032 7.25879C5.3249 8.75071 4.85851 10.2132 3.9622 11.4219L3.42997 12.1357C3.27469 12.3113 3.1846 12.5339 3.17509 12.7656C3.1752 13.0477 3.29018 13.3181 3.49442 13.5176C3.69875 13.717 3.97603 13.8291 4.26493 13.8291H13.7688C13.9153 13.8292 14.0607 13.8 14.1956 13.7441C14.3303 13.6883 14.4524 13.6068 14.554 13.5039C14.6557 13.401 14.735 13.2791 14.7874 13.1455C14.8397 13.012 14.864 12.8695 14.8587 12.7266C14.8647 12.5037 14.8011 12.2842 14.6761 12.0977L14.1429 11.3203C13.3598 10.1714 12.9522 8.81745 12.9739 7.4375V7.31348C12.9739 6.32411 12.5715 5.37512 11.8558 4.6748C11.14 3.97456 10.1687 3.58018 9.15556 3.57812Z" fill="#808290"/>
  </svg>
);
// note-2.svg
const NoteIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.8987 0.917007C7.55559 0.683131 8.26861 0.665802 8.93581 0.867202L10.9632 1.46486C11.3873 1.58819 11.7834 1.79617 12.1282 2.07619C12.4729 2.35625 12.7598 2.70314 12.9719 3.09669C13.1964 3.49163 13.3393 3.92889 13.3928 4.38185C13.4464 4.83488 13.4096 5.29456 13.2835 5.73244L12.2258 9.46876C12.0319 10.147 11.6365 10.7477 11.094 11.1885C10.5514 11.6293 9.88777 11.8885 9.1946 11.9307C8.84559 12.2067 8.44621 12.4098 8.0198 12.5283L5.99831 13.126C5.57535 13.2545 5.13175 13.298 4.69265 13.252C4.25348 13.2059 3.82712 13.072 3.43874 12.8584C3.05027 12.6447 2.70641 12.3547 2.428 12.0059C2.14968 11.6571 1.94156 11.2558 1.81569 10.8252L0.72292 7.08302C0.469216 6.21456 0.563972 5.27894 0.986592 4.48146C1.40934 3.68391 2.12607 3.08955 2.97878 2.82814L5.00026 2.22951C5.09091 2.20456 5.18288 2.1847 5.27565 2.16994C5.6738 1.58926 6.24193 1.15094 6.8987 0.917007ZM3.23171 3.70607C2.91972 3.80054 2.62877 3.95705 2.37624 4.16603C2.12389 4.37493 1.91442 4.63248 1.76003 4.92384C1.60558 5.21538 1.50959 5.53573 1.47683 5.86525C1.44412 6.19465 1.4757 6.52774 1.5696 6.84474L2.66237 10.586C2.85372 11.2239 3.28554 11.7595 3.86355 12.0742C4.44145 12.3888 5.11864 12.4574 5.74636 12.2656L7.70241 11.6856L6.00417 11.1836C5.57932 11.0593 5.18254 10.8511 4.83718 10.5703C4.49169 10.2894 4.20441 9.94129 3.99147 9.54689C3.77854 9.15246 3.64463 8.71889 3.59694 8.2715C3.5493 7.82432 3.5884 7.37196 3.71315 6.94044L4.76491 3.24025L3.23171 3.70607ZM7.97292 1.65626C7.4448 1.66227 6.93158 1.83872 6.50905 2.16115C6.08652 2.48358 5.77588 2.93505 5.62233 3.44923L4.56569 7.18458C4.47492 7.50283 4.44583 7.83667 4.48171 8.16603C4.5176 8.49536 4.61762 8.81424 4.77468 9.10451C4.9318 9.39483 5.14332 9.65143 5.39772 9.85841C5.65211 10.0654 5.94421 10.2194 6.2571 10.3115L8.28347 10.9092C8.9152 11.0941 9.5934 11.016 10.1692 10.6934C10.4536 10.5346 10.7048 10.3201 10.9065 10.0615C11.1083 9.80289 11.2575 9.50552 11.345 9.18751L12.4075 5.45119L12.3841 5.48146C12.4748 5.16317 12.503 4.82942 12.4671 4.50001C12.4311 4.17078 12.3321 3.85171 12.1751 3.56154C12.018 3.27137 11.8063 3.01552 11.552 2.80861C11.2977 2.60165 11.0055 2.44759 10.6926 2.35548L8.6653 1.75783C8.4403 1.69118 8.20727 1.65694 7.97292 1.65626ZM6.96804 7.04201L8.60769 7.47853C8.71653 7.50826 8.81046 7.57903 8.8694 7.67677C8.92835 7.77455 8.94739 7.8917 8.92409 8.00392C8.89672 8.09877 8.84102 8.18301 8.76394 8.24318C8.68686 8.30332 8.59248 8.33655 8.49538 8.33888H8.38405L6.75124 7.90236C6.69566 7.88839 6.64301 7.86371 6.59694 7.82912C6.55098 7.79457 6.51214 7.75101 6.48269 7.70119C6.45327 7.6513 6.43345 7.59565 6.42507 7.5381C6.41672 7.48042 6.4198 7.42079 6.43386 7.36427C6.46298 7.24979 6.53511 7.15125 6.63503 7.09083C6.73515 7.03038 6.85515 7.01305 6.96804 7.04201ZM7.57351 4.69923L10.3342 5.42287C10.4437 5.45626 10.5362 5.53137 10.5921 5.63283C10.648 5.73433 10.6633 5.85432 10.6341 5.96681C10.6075 6.062 10.5511 6.14583 10.4739 6.20607C10.3967 6.26629 10.3026 6.29932 10.2053 6.3008H10.093L7.3323 5.584C7.22486 5.54476 7.13578 5.46545 7.08327 5.36232C7.03081 5.25922 7.01863 5.13925 7.04909 5.02736C7.07959 4.9157 7.15042 4.81968 7.24733 4.7588C7.34451 4.69786 7.46154 4.67663 7.57351 4.69923Z" fill="white"/>
  </svg>
);
const ChevronLeftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 18l-6-6 6-6"/>
  </svg>
);
const MenuIcon  = () => <Icon d="M3 12h18M3 6h18M3 18h18" size={18} />;
const CloseIcon = () => <Icon d="M18 6L6 18M6 6l12 12" size={18} />;

// ── Clarix icon only (circle symbol — used in sidebar header) ─────────────────
const ClarixIcon = () => (
  <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="0.5" y="0.5" width="33" height="33" rx="16.5" fill="#1B1C22"/>
    <rect x="0.5" y="0.5" width="33" height="33" rx="16.5" stroke="#363843"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M17.0001 21.9618C19.7374 21.9618 21.9575 19.7419 21.9575 17.0044C21.9575 14.2669 19.7374 12.0469 17.0001 12.0469C14.2626 12.0469 12.0426 14.2669 12.0426 17.0044C12.0426 17.6652 12.172 18.2957 12.4067 18.8722C12.5146 19.1374 12.6449 19.3911 12.7951 19.631L12.4227 20.3436L11.709 21.7102L11.7091 21.7109L13.3612 21.3469L14.2744 21.1457C15.0565 21.6614 15.9934 21.9618 17.0001 21.9618Z" fill="#1B1C22"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M17.0007 21.963C15.994 21.963 15.0573 21.6626 14.2752 21.1468L13.3619 21.3481L11.7251 21.7086C12.3149 22.369 13.0267 22.9181 13.8252 23.3202C14.7801 23.8011 15.8589 24.072 17.0008 24.072C19.0316 24.072 20.8626 24.9285 22.1524 26.2998C21.9988 25.0502 21.3795 23.9445 20.4735 23.1616C22.6215 21.9479 24.072 19.6434 24.072 17.0008C24.072 13.0962 20.9054 9.92969 17.0008 9.92969C13.0962 9.92969 9.92969 13.0962 9.92969 17.0008C9.92969 18.8039 10.6049 20.4496 11.7163 21.6988L12.4235 20.3447L12.7958 19.6321C12.6457 19.3922 12.5154 19.1385 12.4074 18.8733C12.1727 18.2969 12.0433 17.6663 12.0433 17.0055C12.0433 14.391 14.0685 12.2484 16.6353 12.0613C16.756 12.0525 16.8779 12.048 17.0008 12.048C17.128 12.048 17.2541 12.0528 17.3789 12.0622C19.9398 12.2554 21.9583 14.3953 21.9583 17.0055C21.9583 19.6638 19.8648 21.8341 17.2371 21.9574C17.1586 21.9611 17.08 21.963 17.0008 21.963Z" fill="url(#ciGrad0)"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M20.4735 23.1615C19.6054 22.4113 18.4741 21.9575 17.2371 21.9574C19.8648 21.8341 21.9583 19.6638 21.9583 17.0055C21.9583 14.3953 19.9397 12.2554 17.3789 12.0622C17.2541 12.0528 17.128 12.048 17.0008 12.048C16.8778 12.048 16.756 12.0525 16.6352 12.0613C14.0684 12.2484 12.0433 14.391 12.0433 17.0055C12.0433 17.6663 12.1727 18.2969 12.4074 18.8733C12.5153 19.1385 12.6456 19.3922 12.7958 19.6321L12.4234 20.3447L11.7163 21.6988C10.6049 20.4496 9.92969 18.8039 9.92969 17.0008C9.92969 13.0962 13.0962 9.92969 17.0008 9.92969C20.9054 9.92969 24.072 13.0962 24.072 17.0008C24.072 19.6434 22.6215 21.9479 20.4735 23.1615Z" fill="url(#ciGrad1)"/>
    <defs>
      <linearGradient id="ciGrad0" x1="20.8251" y1="11.0239" x2="13.3091" y2="26.4338" gradientUnits="userSpaceOnUse">
        <stop stopColor="#006AE6"/><stop offset="1" stopColor="white"/>
      </linearGradient>
      <linearGradient id="ciGrad1" x1="24.0236" y1="3.21779" x2="-15.875" y2="81.5231" gradientUnits="userSpaceOnUse">
        <stop stopColor="#006AE6"/><stop offset="1" stopColor="white"/>
      </linearGradient>
    </defs>
  </svg>
);

// ── Clarix brand logo (item.svg — full wordmark, kept for reference) ───────────
const ClarixLogo = () => (
  <svg width="91" height="34" viewBox="0 0 91 34" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="0.5" y="0.5" width="33" height="33" rx="16.5" fill="#1B1C22"/>
    <rect x="0.5" y="0.5" width="33" height="33" rx="16.5" stroke="#363843"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M17.0001 21.9618C19.7374 21.9618 21.9575 19.7419 21.9575 17.0044C21.9575 14.2669 19.7374 12.0469 17.0001 12.0469C14.2626 12.0469 12.0426 14.2669 12.0426 17.0044C12.0426 17.6652 12.172 18.2957 12.4067 18.8722C12.5146 19.1374 12.6449 19.3911 12.7951 19.631L12.4227 20.3436L11.709 21.7102L11.7091 21.7109L13.3612 21.3469L14.2744 21.1457C15.0565 21.6614 15.9934 21.9618 17.0001 21.9618Z" fill="#1B1C22"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M17.0007 21.963C15.994 21.963 15.0573 21.6626 14.2752 21.1468L13.3619 21.3481L11.7251 21.7086C12.3149 22.369 13.0267 22.9181 13.8252 23.3202C14.7801 23.8011 15.8589 24.072 17.0008 24.072C19.0316 24.072 20.8626 24.9285 22.1524 26.2998C21.9988 25.0502 21.3795 23.9445 20.4735 23.1616C22.6215 21.9479 24.072 19.6434 24.072 17.0008C24.072 13.0962 20.9054 9.92969 17.0008 9.92969C13.0962 9.92969 9.92969 13.0962 9.92969 17.0008C9.92969 18.8039 10.6049 20.4496 11.7163 21.6988L12.4235 20.3447L12.7958 19.6321C12.6457 19.3922 12.5154 19.1385 12.4074 18.8733C12.1727 18.2969 12.0433 17.6663 12.0433 17.0055C12.0433 14.391 14.0685 12.2484 16.6353 12.0613C16.756 12.0525 16.8779 12.048 17.0008 12.048C17.128 12.048 17.2541 12.0528 17.3789 12.0622C19.9398 12.2554 21.9583 14.3953 21.9583 17.0055C21.9583 19.6638 19.8648 21.8341 17.2371 21.9574C17.1586 21.9611 17.08 21.963 17.0008 21.963Z" fill="url(#clarixGrad0)"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M20.4735 23.1615C19.6054 22.4113 18.4741 21.9575 17.2371 21.9574C19.8648 21.8341 21.9583 19.6638 21.9583 17.0055C21.9583 14.3953 19.9397 12.2554 17.3789 12.0622C17.2541 12.0528 17.128 12.048 17.0008 12.048C16.8778 12.048 16.756 12.0525 16.6352 12.0613C14.0684 12.2484 12.0433 14.391 12.0433 17.0055C12.0433 17.6663 12.1727 18.2969 12.4074 18.8733C12.5153 19.1385 12.6456 19.3922 12.7958 19.6321L12.4234 20.3447L11.7163 21.6988C10.6049 20.4496 9.92969 18.8039 9.92969 17.0008C9.92969 13.0962 13.0962 9.92969 17.0008 9.92969C20.9054 9.92969 24.072 13.0962 24.072 17.0008C24.072 19.6434 22.6215 21.9479 20.4735 23.1615Z" fill="url(#clarixGrad1)"/>
    <path d="M54.3111 14.6662H52.3168C52.2401 14.2401 52.0973 13.8651 51.8885 13.5412C51.6797 13.2173 51.424 12.9425 51.1214 12.7166C50.8189 12.4908 50.4801 12.3203 50.1051 12.2053C49.7344 12.0902 49.3402 12.0327 48.9226 12.0327C48.1683 12.0327 47.4929 12.2223 46.8963 12.6016C46.304 12.9808 45.8352 13.5369 45.4901 14.2699C45.1491 15.0028 44.9787 15.8977 44.9787 16.9545C44.9787 18.0199 45.1491 18.919 45.4901 19.652C45.8352 20.3849 46.3061 20.9389 46.9027 21.3139C47.4993 21.6889 48.1705 21.8764 48.9162 21.8764C49.3295 21.8764 49.7216 21.821 50.0923 21.7102C50.4673 21.5952 50.8061 21.4268 51.1087 21.2053C51.4112 20.9837 51.6669 20.7131 51.8757 20.3935C52.0888 20.0696 52.2358 19.6989 52.3168 19.2812L54.3111 19.2876C54.2045 19.9311 53.9979 20.5234 53.6911 21.0646C53.3885 21.6016 52.9986 22.0661 52.5213 22.4581C52.0483 22.8459 51.5071 23.1463 50.8977 23.3594C50.2884 23.5724 49.6236 23.679 48.9034 23.679C47.7699 23.679 46.7599 23.4105 45.8736 22.8736C44.9872 22.3324 44.2884 21.5589 43.777 20.5533C43.2699 19.5476 43.0163 18.348 43.0163 16.9545C43.0163 15.5568 43.272 14.3572 43.7834 13.3558C44.2947 12.3501 44.9936 11.5788 45.88 11.0419C46.7663 10.5007 47.7741 10.2301 48.9034 10.2301C49.598 10.2301 50.2457 10.3303 50.8466 10.5305C51.4517 10.7266 51.995 11.0163 52.4766 11.3999C52.9581 11.7791 53.3565 12.2436 53.6719 12.7933C53.9872 13.3388 54.2003 13.9631 54.3111 14.6662ZM58.2524 10.4091V23.5H56.3411V10.4091H58.2524ZM63.5008 23.7173C62.8786 23.7173 62.3161 23.6023 61.8133 23.3722C61.3105 23.1378 60.912 22.799 60.618 22.3558C60.3282 21.9126 60.1833 21.3693 60.1833 20.7259C60.1833 20.1719 60.2899 19.7159 60.5029 19.358C60.716 19 61.0036 18.7166 61.3659 18.5078C61.7281 18.299 62.1329 18.1413 62.5803 18.0348C63.0278 17.9283 63.4837 17.8473 63.9482 17.7919C64.5363 17.7237 65.0136 17.6683 65.3801 17.6257C65.7465 17.5788 66.0129 17.5043 66.1791 17.402C66.3453 17.2997 66.4284 17.1335 66.4284 16.9034V16.8587C66.4284 16.3004 66.2707 15.8679 65.9553 15.5611C65.6443 15.2543 65.1798 15.1009 64.5619 15.1009C63.9184 15.1009 63.4113 15.2436 63.0406 15.5291C62.6741 15.8104 62.4205 16.1236 62.2799 16.4688L60.4837 16.0597C60.6968 15.4631 61.0079 14.9815 61.417 14.6151C61.8303 14.2443 62.3055 13.9759 62.8424 13.8097C63.3793 13.6392 63.944 13.554 64.5363 13.554C64.9284 13.554 65.3438 13.6009 65.7828 13.6946C66.2259 13.7841 66.6393 13.9503 67.0228 14.1932C67.4106 14.4361 67.7281 14.7834 67.9752 15.2351C68.2224 15.6825 68.346 16.2642 68.346 16.9801V23.5H66.4795V22.1577H66.4028C66.2792 22.4048 66.0938 22.6477 65.8467 22.8864C65.5995 23.125 65.282 23.3232 64.8943 23.4808C64.5065 23.6385 64.042 23.7173 63.5008 23.7173ZM63.9163 22.1832C64.4447 22.1832 64.8964 22.0788 65.2714 21.87C65.6507 21.6612 65.9383 21.3885 66.1343 21.0518C66.3346 20.7109 66.4347 20.3466 66.4347 19.9588V18.6932C66.3666 18.7614 66.2345 18.8253 66.0384 18.8849C65.8467 18.9403 65.6272 18.9893 65.3801 19.032C65.1329 19.0703 64.8921 19.1065 64.6578 19.1406C64.4234 19.1705 64.2274 19.196 64.0697 19.2173C63.6989 19.2642 63.3602 19.343 63.0534 19.4538C62.7508 19.5646 62.5079 19.7244 62.3247 19.9332C62.1457 20.1378 62.0562 20.4105 62.0562 20.7514C62.0562 21.2244 62.2309 21.5824 62.5803 21.8253C62.9298 22.0639 63.3751 22.1832 63.9163 22.1832ZM70.7116 23.5V13.6818H72.5589V15.2415H72.6612C72.8401 14.7131 73.1555 14.2976 73.6072 13.995C74.0632 13.6882 74.5788 13.5348 75.1541 13.5348C75.2734 13.5348 75.414 13.5391 75.5759 13.5476C75.7421 13.5561 75.8721 13.5668 75.9659 13.5795V15.4077C75.8892 15.3864 75.7528 15.3629 75.5568 15.3374C75.3607 15.3075 75.1647 15.2926 74.9687 15.2926C74.517 15.2926 74.1143 15.3885 73.7606 15.5803C73.4112 15.7678 73.1342 16.0298 72.9296 16.3665C72.7251 16.6989 72.6228 17.0781 72.6228 17.5043V23.5H70.7116ZM77.4398 23.5V13.6818H79.351V23.5H77.4398ZM78.405 12.1669C78.0726 12.1669 77.7871 12.0561 77.5485 11.8345C77.3141 11.6087 77.1969 11.3402 77.1969 11.0291C77.1969 10.7138 77.3141 10.4453 77.5485 10.2237C77.7871 9.99787 78.0726 9.88494 78.405 9.88494C78.7374 9.88494 79.0208 9.99787 79.2551 10.2237C79.4938 10.4453 79.6131 10.7138 79.6131 11.0291C79.6131 11.3402 79.4938 11.6087 79.2551 11.8345C79.0208 12.0561 78.7374 12.1669 78.405 12.1669ZM83.2507 13.6818L85.4176 17.5043L87.6037 13.6818H89.6939L86.6321 18.5909L89.7195 23.5H87.6293L85.4176 19.831L83.2124 23.5H81.1158L84.1712 18.5909L81.1542 13.6818H83.2507Z" fill="white"/>
    <defs>
      <linearGradient id="clarixGrad0" x1="20.8251" y1="11.0239" x2="13.3091" y2="26.4338" gradientUnits="userSpaceOnUse">
        <stop stopColor="#006AE6"/><stop offset="1" stopColor="white"/>
      </linearGradient>
      <linearGradient id="clarixGrad1" x1="24.0236" y1="3.21779" x2="-15.875" y2="81.5231" gradientUnits="userSpaceOnUse">
        <stop stopColor="#006AE6"/><stop offset="1" stopColor="white"/>
      </linearGradient>
    </defs>
  </svg>
);

// ── general.svg — verified badge ─────────────────────────────────────────────
const VerifyBadge = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14.5413 6.39633L13.4988 5.33883C13.4261 5.26761 13.3687 5.18234 13.33 5.08821C13.2913 4.99409 13.2722 4.89308 13.2738 4.79133V3.29133C13.2728 3.08583 13.2313 2.88255 13.1515 2.69316C13.0717 2.50378 12.9553 2.33202 12.809 2.18776C12.6626 2.0435 12.4892 1.92958 12.2987 1.85253C12.1082 1.77549 11.9043 1.73685 11.6988 1.73883H10.1988C10.0971 1.74043 9.99607 1.72131 9.90194 1.68263C9.80782 1.64394 9.72255 1.58651 9.65133 1.51383L8.60133 0.456327C8.30882 0.164129 7.91228 0 7.49883 0C7.08538 0 6.68884 0.164129 6.39633 0.456327L5.33883 1.49883C5.26761 1.57151 5.18234 1.62894 5.08821 1.66763C4.99409 1.70631 4.89308 1.72543 4.79133 1.72383H3.29133C3.08583 1.72481 2.88255 1.76638 2.69316 1.84615C2.50378 1.92593 2.33202 2.04233 2.18776 2.18869C2.0435 2.33504 1.92958 2.50845 1.85253 2.69897C1.77549 2.88948 1.73685 3.09334 1.73883 3.29883V4.79883C1.74043 4.90058 1.72131 5.00159 1.68263 5.09571C1.64394 5.18984 1.58651 5.27511 1.51383 5.34633L0.456327 6.39633C0.164129 6.68884 0 7.08538 0 7.49883C0 7.91228 0.164129 8.30882 0.456327 8.60133L1.49883 9.65883C1.57151 9.73005 1.62894 9.81532 1.66763 9.90944C1.70631 10.0036 1.72543 10.1046 1.72383 10.2063V11.7063C1.72481 11.9118 1.76638 12.1151 1.84615 12.3045C1.92593 12.4939 2.04233 12.6656 2.18869 12.8099C2.33504 12.9542 2.50845 13.0681 2.69897 13.1451C2.88948 13.2222 3.09334 13.2608 3.29883 13.2588H4.79883C4.90058 13.2572 5.00159 13.2763 5.09571 13.315C5.18984 13.3537 5.27511 13.4111 5.34633 13.4838L6.40383 14.5413C6.69634 14.8335 7.09288 14.9977 7.50633 14.9977C7.91978 14.9977 8.31632 14.8335 8.60883 14.5413L9.65883 13.4988C9.73005 13.4261 9.81532 13.3687 9.90944 13.33C10.0036 13.2913 10.1046 13.2722 10.2063 13.2738H11.7063C12.1201 13.2738 12.5169 13.1095 12.8094 12.8169C13.102 12.5244 13.2663 12.1276 13.2663 11.7138V10.2138C13.2647 10.1121 13.2838 10.0111 13.3225 9.91694C13.3612 9.82282 13.4186 9.73755 13.4913 9.66633L14.5488 8.60883C14.6941 8.46336 14.8093 8.2906 14.8876 8.10048C14.9659 7.91036 15.0059 7.70663 15.0052 7.50102C15.0045 7.2954 14.9631 7.09195 14.8835 6.90237C14.8039 6.71278 14.6876 6.54081 14.5413 6.39633ZM10.6338 6.14883L6.95133 9.74883C6.89939 9.80141 6.83748 9.84309 6.76922 9.87143C6.70096 9.89976 6.62773 9.91418 6.55383 9.91383C6.47946 9.91278 6.40603 9.897 6.3378 9.86739C6.26957 9.83778 6.20789 9.79493 6.15633 9.74133L4.37883 7.94133C4.32416 7.88928 4.28053 7.82677 4.25053 7.75751C4.22053 7.68825 4.20477 7.61366 4.2042 7.53819C4.20363 7.46271 4.21825 7.38789 4.2472 7.31818C4.27615 7.24848 4.31883 7.18531 4.37271 7.13245C4.42658 7.07958 4.49054 7.0381 4.56078 7.01047C4.63102 6.98284 4.7061 6.96963 4.78155 6.97163C4.857 6.97362 4.93128 6.99078 4.99996 7.02208C5.06864 7.05338 5.13032 7.09819 5.18133 7.15383L6.56133 8.55633L9.84633 5.34633C9.9518 5.24099 10.0948 5.18182 10.2438 5.18182C10.3929 5.18182 10.5359 5.24099 10.6413 5.34633C10.6941 5.39918 10.7359 5.46202 10.7641 5.53118C10.7924 5.60035 10.8066 5.67444 10.8059 5.74915C10.8052 5.82386 10.7896 5.89768 10.7601 5.9663C10.7305 6.03492 10.6876 6.09697 10.6338 6.14883Z" fill="#006AE6"/>
  </svg>
);

// ── Local FAQ Knowledge Base ───────────────────────────────────────────────────
const FAQS = [
  { q: "pricing", a: "We offer three plans:\n• **Starter** — $29/mo (up to 3 users)\n• **Pro** — $79/mo (unlimited users + analytics)\n• **Enterprise** — Custom pricing with SLA\n\nAll plans include a 14-day free trial, no credit card required." },
  { q: "demo",    a: "Absolutely! Our team offers live 30-minute demos tailored to your use case. Book directly at **demo.clarix.qa.team** or leave your email and we'll reach out within 24 hours." },
  { q: "integrations", a: "We integrate with 50+ tools including **Slack, HubSpot, Salesforce, Zapier, Google Workspace**, and more. We also offer a REST API + webhooks for custom integrations." },
  { q: "trial",   a: "Yes! Every plan starts with a **14-day free trial** — full access, no credit card required. You can upgrade, downgrade, or cancel anytime from your dashboard." },
  { q: "support", a: "We offer:\n• **Live chat** (Pro+): Mon–Fri, 9am–6pm EST\n• **Email**: clarix@qa.team (24h response)\n• **Help Center**: docs.clarix.qa.team\n• **Enterprise**: Dedicated success manager" },
  { q: "security", a: "Security is our top priority. We're **SOC 2 Type II certified**, GDPR compliant, use AES-256 encryption at rest and TLS 1.3 in transit. Hosted on AWS us-east-1 with daily backups." },
  { q: "cancel",  a: "Cancel anytime from **Settings → Billing** with one click. No fees. Your data is exportable for 30 days after cancellation." },
];

function matchLocalFAQ(input: string): string | null {
  const q = input.toLowerCase();
  const map = [
    { keys: ["pric", "cost", "plan", "subscri", "how much", "fee"],          idx: 0 },
    { keys: ["demo", "walkthrough", "tour", "show me", "see it"],            idx: 1 },
    { keys: ["integrat", "connect", "zapier", "slack", "salesforce", "api"], idx: 2 },
    { keys: ["trial", "free", "try"],                                         idx: 3 },
    { keys: ["support", "help", "contact", "reach"],                          idx: 4 },
    { keys: ["secur", "gdpr", "compli", "encrypt", "safe", "data"],          idx: 5 },
    { keys: ["cancel", "stop", "unsubscri", "refund"],                        idx: 6 },
  ];
  for (const { keys, idx } of map) {
    if (keys.some((k) => q.includes(k))) return FAQS[idx].a;
  }
  return null;
}

// ── Markdown-lite renderer ────────────────────────────────────────────────────
function renderMD(text: string) {
  return text.split("\n").map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
      p.startsWith("**") ? <strong key={j} className="font-semibold text-[#f5f5f5]">{p.slice(2, -2)}</strong> : p
    );
    const isBullet = line.trim().startsWith("•") || line.trim().startsWith("-");
    return (
      <span key={i} className={`block ${isBullet ? "pl-1" : ""} ${i > 0 && !isBullet ? "mt-1" : ""}`}>
        {parts}
      </span>
    );
  });
}

// ── Typing dots ───────────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <span key={i} className="w-2 h-2 rounded-full bg-[#464852]"
          style={{ animation: `tdB 1.2s ${i * 0.2}s infinite` }} />
      ))}
      <style>{`@keyframes tdB{0%,80%,100%{transform:translateY(0);opacity:.5}40%{transform:translateY(-5px);opacity:1}}`}</style>
    </div>
  );
}

// ── Toggle Switch ─────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button type="button" onClick={onChange} role="switch" aria-checked={checked}
      className={`relative inline-flex w-[30px] h-[18px] shrink-0 rounded-full transition-colors duration-200
        focus:outline-none ${checked ? "bg-[#006AE6]" : "bg-[#363843]"}`}>
      <span className={`inline-block w-3 h-3 bg-white rounded-full shadow transition-transform duration-200 self-center
        ${checked ? "translate-x-[15px]" : "translate-x-[3px]"}`} />
    </button>
  );
}

// ── Bot Avatar ────────────────────────────────────────────────────────────────
function BotAvatar({ size = 30 }: { size?: number }) {
  return (
    <div
      className="relative shrink-0 rounded-full flex items-center justify-center"
      style={{
        width: size, height: size,
        background: "#272134",
        border: "0.375px solid rgba(136,63,255,0.2)",
      }}
    >
      <span className="font-semibold text-[#883fff]" style={{ fontSize: size * 0.6, lineHeight: 1 }}>S</span>
      <span
        className="absolute rounded-full border-[#111217]"
        style={{
          width: size * 0.2, height: size * 0.2,
          bottom: -1, right: -1,
          background: "#00A261",
          borderWidth: size * 0.04,
          borderStyle: "solid",
        }}
      />
    </div>
  );
}

// ── Inline Form Card (shown inside messages area) ──────────────────────────────
function InlineFormCard({
  title, submitLabel, onSubmit, onDismiss,
}: {
  title: string; submitLabel: string;
  onSubmit: (d: { name: string; email: string }) => void;
  onDismiss: () => void;
}) {
  const [name, setName]   = useState("");
  const [email, setEmail] = useState("");
  const [err, setErr]     = useState("");

  const handle = () => {
    if (!name.trim())                return setErr("Name is required");
    if (!/\S+@\S+\.\S+/.test(email)) return setErr("Valid email is required");
    setErr("");
    onSubmit({ name: name.trim(), email: email.trim() });
  };

  return (
    <div className="flex items-end gap-[14px] px-[20px] mb-[10px]" style={{ animation: "fadeUp 0.2s ease" }}>
      <BotAvatar size={30} />
      {/* Form card styled as bot bubble */}
      <div className="rounded-br-[12px] rounded-tl-[12px] rounded-tr-[12px] border overflow-hidden shadow-[0px_10px_14px_0px_rgba(15,42,81,0.03)]"
        style={{ background: "#0d0e12", borderColor: "#26272f" }}>
        <div className="p-[16px] flex flex-col gap-[16px] min-w-[320px] max-w-[420px]">
          {/* Header */}
          <div className="flex flex-col gap-[12px]">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-[16px] text-[#f5f5f5] leading-[20px]">{title}</p>
              <button onClick={onDismiss} className="text-[#636674] hover:text-[#f5f5f5] transition-colors ml-4 shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            {/* Divider */}
            <div className="h-px w-full bg-[#26272f]" />
          </div>
          {/* Fields */}
          <div className="flex flex-col">
            <div className="flex items-center gap-[10px] py-[6px]">
              <div className="w-[100px] shrink-0">
                <p className="text-[13px] text-[#b5b7c8] leading-[14px]">Name</p>
              </div>
              <input value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="flex-1 text-[13px] bg-[#1f212a] border border-[#363843] rounded-[6px] px-[12px] py-[13px] text-[#f5f5f5] placeholder-[#808290] focus:outline-none focus:border-[#006AE6] focus:ring-1 focus:ring-[#006AE6]/30 leading-[14px]" />
            </div>
            <div className="flex items-center gap-[10px] py-[6px]">
              <div className="w-[100px] shrink-0">
                <p className="text-[13px] text-[#b5b7c8] leading-[14px]">Email</p>
              </div>
              <input value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                onKeyDown={(e) => e.key === "Enter" && handle()}
                className="flex-1 text-[13px] bg-[#1f212a] border border-[#363843] rounded-[6px] px-[12px] py-[13px] text-[#f5f5f5] placeholder-[#808290] focus:outline-none focus:border-[#006AE6] focus:ring-1 focus:ring-[#006AE6]/30 leading-[14px]" />
            </div>
          </div>
          {err && <p className="text-red-400 text-xs -mt-2">{err}</p>}
          {/* Submit */}
          <div className="flex justify-end">
            <button onClick={handle}
              className="px-[12px] py-[10px] bg-[#006AE6] hover:bg-blue-500 text-[#f5f5f5] text-[12px] font-medium rounded-[6px] transition-colors active:scale-[0.98] leading-[12px]">
              {submitLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Message Bubble ────────────────────────────────────────────────────────────
function Bubble({ msg }: { msg: ChatMessage }) {
  const isBot = msg.role === "bot";
  return (
    <div
      className={`flex items-end gap-[14px] px-[20px] mb-[10px] ${isBot ? "" : "flex-row-reverse"}`}
      style={{ animation: "fadeUp 0.2s ease" }}
    >
      {isBot ? (
        <BotAvatar size={30} />
      ) : (
        <div className="w-[30px] h-[30px] rounded-full bg-[#f9f9f9] border border-[#99a1b7] flex items-center justify-center shrink-0 overflow-hidden">
          <UserIcon />
        </div>
      )}

      <div className="flex flex-col gap-[4px] max-w-[75%]" style={{ alignItems: isBot ? "flex-start" : "flex-end" }}>
        <div
          className={`px-[14px] py-[10px] text-[16px] leading-[30px] tracking-[-0.16px] opacity-90 text-[#f5f5f5]
            border ${isBot
              ? "rounded-br-[12px] rounded-tl-[12px] rounded-tr-[12px]"
              : "rounded-bl-[12px] rounded-tl-[12px] rounded-tr-[12px]"
            }`}
          style={{
            background: "#0d0e12",
            borderColor: "rgba(54,56,67,0.5)",
          }}
        >
          {isBot ? renderMD(msg.text) : msg.text}
        </div>
        <p className="text-[12px] text-[#9a9cae] leading-[22px]">Just Now</p>
      </div>
    </div>
  );
}

// ── Quick Replies (Pricing + Demo only — shown on first message) ───────────────
function ChatQuickReplies({ settings, onFAQ, onLead, visible }: {
  settings: Settings;
  onFAQ: (msg: string) => void;
  onLead: () => void;
  visible: boolean;
}) {
  const buttons = [
    { label: "💰  Give Me Pricing Details", gate: "faqs"  as keyof Settings, action: () => onFAQ("What are your pricing plans?") },
    { label: "🎯  Need Demo",               gate: "leads" as keyof Settings, action: onLead },
  ].filter((b) => settings[b.gate]);

  if (!visible || buttons.length === 0) return null;

  return (
    <div className="flex flex-col gap-2.5 mb-[10px] px-[20px] ml-[44px] items-start">
      {buttons.map((b) => (
        <button key={b.label} onClick={b.action}
          className="text-left px-4 py-3 rounded-xl border border-[#363843] bg-[#1f212a] text-[15px] font-semibold text-[#9a9cae] hover:bg-[#26272f] hover:text-[#f5f5f5] hover:border-[#464852] transition-all duration-150 active:scale-[0.98] leading-snug">
          {b.label}
        </button>
      ))}
    </div>
  );
}

// ── Sidebar ────────────────────────────────────────────────────────────────────
function Sidebar({ settings, onChange, onNewChat, onClose, onLead, onTalkToHuman, stats }: {
  settings: Settings;
  onChange: (key: keyof Settings) => void;
  onNewChat: () => void;
  onClose: () => void;
  onLead: () => void;
  onTalkToHuman: () => void;
  stats: { sessions: number; csat: number };
}) {
  return (
    <div className="w-[270px] bg-[#111217] flex flex-col h-full overflow-hidden shrink-0">

      {/* ── Header ── */}
      <div className="h-[70px] px-[15px] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-[8px]">
          <ClarixIcon />
          <p className="font-medium text-[18px] text-white leading-[18px] tracking-[-0.18px]">Clarix</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="w-[28px] h-[28px] bg-[#1b1c22] rounded-full flex items-center justify-center text-[#636674] hover:text-[#f5f5f5] transition-colors">
            <ChevronLeftIcon />
          </button>
          <button onClick={onClose} className="sm:hidden text-[#636674] hover:text-[#9A9CAE] rounded-lg p-1 transition-colors ml-1">
            <CloseIcon />
          </button>
        </div>
      </div>

      {/* ── Chat Bot Settings ── */}
      <div className="px-[15px] flex flex-col gap-[6px] shrink-0">
        <div className="flex items-center pb-[10px] px-[5px]">
          <p className="text-[14px] text-[#636674] leading-[14px]">Chat Bot Settings</p>
        </div>

        {/* FAQ row — active (highlighted) */}
        <div className="bg-[#1b1c22] flex items-center justify-between p-[10px] rounded-[6px]">
          <div className="flex gap-[10px] items-start">
            {/* home-3.svg */}
            <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 mt-0.5">
              <path d="M12.55 16.0755H3.57503C3.10669 16.0805 2.64204 15.9924 2.20802 15.8163C1.77399 15.6403 1.37925 15.3798 1.04668 15.05C0.714109 14.7203 0.450336 14.3277 0.270662 13.8952C0.090989 13.4627 -0.00100804 12.9988 8.33042e-06 12.5304V8.29722C0.0097648 7.51255 0.186954 6.739 0.519724 6.02832C0.852495 5.31763 1.33318 4.68619 1.92962 4.17623L5.75145 0.877935C6.40429 0.311722 7.23946 0 8.10363 0C8.96781 0 9.80298 0.311722 10.4558 0.877935L14.2477 4.22858C14.8388 4.74639 15.3121 5.38474 15.6359 6.10072C15.9597 6.8167 16.1265 7.5937 16.125 8.37949V12.5828C16.122 13.0447 16.0273 13.5014 15.8463 13.9264C15.6652 14.3514 15.4015 14.7362 15.0704 15.0583C14.7379 15.3854 14.3441 15.6435 13.9116 15.8181C13.479 15.9926 13.0163 16.0801 12.55 16.0755ZM10.3062 14.9536H12.55C13.1902 14.9564 13.8057 14.7064 14.2627 14.2581C14.4953 14.0433 14.6817 13.7832 14.8103 13.4938C14.9389 13.2045 15.007 12.8919 15.0106 12.5753V8.37201C15.0126 7.74709 14.8801 7.12905 14.622 6.55991C14.3639 5.99078 13.9863 5.48389 13.5148 5.07372L9.71538 1.73803C9.26609 1.3511 8.69284 1.13827 8.09989 1.13827C7.50695 1.13827 6.9337 1.3511 6.48441 1.73803L2.66257 5.05128C2.19281 5.46126 1.81626 5.96706 1.55825 6.53469C1.30024 7.10231 1.16675 7.71859 1.16675 8.3421V12.5753C1.17657 13.2075 1.43463 13.8105 1.8852 14.2541C2.33578 14.6976 2.94274 14.9462 3.57503 14.9462H10.3062V14.9536ZM11.5926 12.8296C11.5926 12.6808 11.5335 12.5381 11.4283 12.4329C11.3232 12.3277 11.1805 12.2686 11.0317 12.2686H5.07085C4.92208 12.2686 4.77941 12.3277 4.67421 12.4329C4.56902 12.5381 4.50992 12.6808 4.50992 12.8296C4.50992 12.9783 4.56902 13.121 4.67421 13.2262C4.77941 13.3314 4.92208 13.3905 5.07085 13.3905H11.0541C11.1959 13.3831 11.3297 13.323 11.4293 13.222C11.529 13.121 11.5872 12.9863 11.5926 12.8445V12.8296Z" fill="#F5F5F5"/>
            </svg>
            <div className="flex flex-col gap-[4px]">
              <p className="font-medium text-[14px] text-[#f5f5f5] leading-[14px]">FAQ</p>
              <p className="text-[12px] text-[#f5f5f5] leading-[14px]">Overview</p>
            </div>
          </div>
          <Toggle checked={settings.faqs} onChange={() => onChange("faqs")} />
        </div>

        {/* Lead Capture row — inactive */}
        <div className="flex items-center justify-between p-[10px] rounded-[6px]">
          <div className="flex gap-[10px] items-start">
            {/* home-3.svg (dimmed for inactive state) */}
            <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 mt-0.5" style={{ opacity: 0.5 }}>
              <path d="M12.55 16.0755H3.57503C3.10669 16.0805 2.64204 15.9924 2.20802 15.8163C1.77399 15.6403 1.37925 15.3798 1.04668 15.05C0.714109 14.7203 0.450336 14.3277 0.270662 13.8952C0.090989 13.4627 -0.00100804 12.9988 8.33042e-06 12.5304V8.29722C0.0097648 7.51255 0.186954 6.739 0.519724 6.02832C0.852495 5.31763 1.33318 4.68619 1.92962 4.17623L5.75145 0.877935C6.40429 0.311722 7.23946 0 8.10363 0C8.96781 0 9.80298 0.311722 10.4558 0.877935L14.2477 4.22858C14.8388 4.74639 15.3121 5.38474 15.6359 6.10072C15.9597 6.8167 16.1265 7.5937 16.125 8.37949V12.5828C16.122 13.0447 16.0273 13.5014 15.8463 13.9264C15.6652 14.3514 15.4015 14.7362 15.0704 15.0583C14.7379 15.3854 14.3441 15.6435 13.9116 15.8181C13.479 15.9926 13.0163 16.0801 12.55 16.0755ZM10.3062 14.9536H12.55C13.1902 14.9564 13.8057 14.7064 14.2627 14.2581C14.4953 14.0433 14.6817 13.7832 14.8103 13.4938C14.9389 13.2045 15.007 12.8919 15.0106 12.5753V8.37201C15.0126 7.74709 14.8801 7.12905 14.622 6.55991C14.3639 5.99078 13.9863 5.48389 13.5148 5.07372L9.71538 1.73803C9.26609 1.3511 8.69284 1.13827 8.09989 1.13827C7.50695 1.13827 6.9337 1.3511 6.48441 1.73803L2.66257 5.05128C2.19281 5.46126 1.81626 5.96706 1.55825 6.53469C1.30024 7.10231 1.16675 7.71859 1.16675 8.3421V12.5753C1.17657 13.2075 1.43463 13.8105 1.8852 14.2541C2.33578 14.6976 2.94274 14.9462 3.57503 14.9462H10.3062V14.9536ZM11.5926 12.8296C11.5926 12.6808 11.5335 12.5381 11.4283 12.4329C11.3232 12.3277 11.1805 12.2686 11.0317 12.2686H5.07085C4.92208 12.2686 4.77941 12.3277 4.67421 12.4329C4.56902 12.5381 4.50992 12.6808 4.50992 12.8296C4.50992 12.9783 4.56902 13.121 4.67421 13.2262C4.77941 13.3314 4.92208 13.3905 5.07085 13.3905H11.0541C11.1959 13.3831 11.3297 13.323 11.4293 13.222C11.529 13.121 11.5872 12.9863 11.5926 12.8445V12.8296Z" fill="#9a9cae"/>
            </svg>
            <div className="flex flex-col gap-[4px]">
              <p className="font-medium text-[14px] text-[#9a9cae] leading-[14px]">Lead Capture</p>
              <p className="text-[12px] text-[#9a9cae] leading-[14px]">Collect Contact Details</p>
            </div>
          </div>
          <Toggle checked={settings.leads} onChange={() => onChange("leads")} />
        </div>
      </div>

      {/* ── Spacer ── */}
      <div className="flex-1" />

      {/* ── Bottom section ── */}
      <div className="px-[15px] pb-[15px] flex flex-col gap-[10px] shrink-0">

        {/* Agent Profile Card */}
        <div className="bg-[#111217] border border-[#1b1c22] rounded-[6px] shadow-[0px_3px_4px_0px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="px-[15px] py-[16px] flex flex-col gap-[24px] items-center">
            {/* Avatar + info */}
            <div className="flex gap-[10px] items-center w-full">
              <BotAvatar size={50} />
              <div className="flex flex-col gap-[8px]">
                <div className="flex gap-[4px] items-center">
                  <p className="font-medium text-[16px] text-[#f5f5f5] leading-[16px]">Clarix</p>
                  <VerifyBadge />
                </div>
                <div className="flex items-center gap-[5px]">
                  {/* abstract-41.svg */}
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13.9605 3.0072C14.0018 2.91416 14.0124 2.81042 13.9908 2.71096C13.9692 2.61149 13.9166 2.52146 13.8405 2.45387V2.45387L12.0605 0.653866C11.8611 0.450163 11.6089 0.306073 11.3322 0.237771C11.0554 0.169469 10.7651 0.179659 10.4939 0.267199C8.61386 0.933866 3.89387 0.693866 3.16053 0.0938656C3.13016 0.0710126 3.09643 0.0530199 3.06053 0.0405322V0.0405322C2.96631 -0.000218302 2.86172 -0.010559 2.76134 0.0109511C2.66096 0.0324612 2.56979 0.0847505 2.50053 0.160532L0.633866 1.93387C0.431456 2.13411 0.288249 2.38635 0.220024 2.66278C0.151798 2.93921 0.161202 3.2291 0.247199 3.50053C0.551992 4.60499 0.691286 5.74854 0.660532 6.89387C0.660532 9.4472 0.187199 10.6739 0.0938656 10.8005C0.0710126 10.8309 0.0530199 10.8646 0.0405322 10.9005C0.0405322 10.9005 0.0405322 10.9005 0.0405322 10.9005C-0.000218302 10.9948 -0.010559 11.0993 0.0109511 11.1997C0.0324612 11.3001 0.0847506 11.3913 0.160532 11.4605V11.4605L1.95387 13.2605C2.15265 13.463 2.40373 13.6064 2.67915 13.6746C2.95456 13.7429 3.24352 13.7334 3.51387 13.6472C5.39387 12.9805 10.1139 13.2205 10.8472 13.8205C10.9365 13.896 11.0503 13.9363 11.1672 13.9339C11.236 13.9339 11.3041 13.9197 11.3672 13.8921C11.4303 13.8646 11.4871 13.8243 11.5339 13.7739C11.5465 13.7571 11.5576 13.7392 11.5672 13.7205L13.3472 11.9605C13.5509 11.7611 13.695 11.5089 13.7633 11.2322C13.8316 10.9554 13.8214 10.6651 13.7339 10.3939C13.0672 8.51387 13.3072 3.79387 13.9072 3.06053C13.9268 3.04464 13.9446 3.02676 13.9605 3.0072V3.0072Z" fill="#636674"/>
                  </svg>
                  <p className="text-[14px] text-[#9a9cae] leading-[14px] text-center">AI Support Agent</p>
                </div>
              </div>
            </div>
            {/* Stats */}
            <div className="flex gap-[12px] w-full">
              <div className="flex-1 border border-dashed border-[#464852] rounded-[4px] px-[11px] py-[9px] flex flex-col gap-[7px] overflow-hidden">
                <p className="font-medium text-[14px] text-[#f5f5f5] leading-[14px]">{stats.sessions}</p>
                <p className="text-[12px] text-[#9a9cae] leading-[12px]">Session</p>
              </div>
              <div className="flex-1 border border-dashed border-[#464852] rounded-[4px] px-[11px] py-[9px] flex flex-col gap-[7px] overflow-hidden">
                <p className="font-medium text-[14px] text-[#f5f5f5] leading-[14px]">{stats.csat}%</p>
                <p className="text-[12px] text-[#9a9cae] leading-[12px]">CSAT</p>
              </div>
            </div>
          </div>
        </div>

        {/* New chat button */}
        <button
          onClick={() => { onNewChat(); onClose(); }}
          className="w-full bg-[#1f212a] border border-[#363843] flex items-center justify-center gap-[4px] px-[10px] py-[9px] rounded-[6px] transition-colors hover:bg-[#26272f] hover:border-[#464852] active:scale-[0.98]">
          {/* plus-squared.svg */}
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8.5575 0.816667C8.97346 0.816667 9.38535 0.898597 9.76965 1.05778C10.1539 1.21696 10.5031 1.45028 10.7973 1.74441C11.0914 2.03854 11.3247 2.38772 11.4839 2.77202C11.6431 3.15632 11.725 3.5682 11.725 3.98417V8.5575C11.725 8.97346 11.6431 9.38535 11.4839 9.76965C11.3247 10.1539 11.0914 10.5031 10.7973 10.7973C10.5031 11.0914 10.1539 11.3247 9.76965 11.4839C9.38535 11.6431 8.97346 11.725 8.5575 11.725H3.98417C3.14409 11.725 2.33843 11.3913 1.74441 10.7973C1.15038 10.2032 0.816667 9.39757 0.816667 8.5575V3.98417C0.816667 3.14409 1.15038 2.33843 1.74441 1.74441C2.33843 1.15038 3.14409 0.816667 3.98417 0.816667H8.5575ZM3.54667 6.81333H5.72833V8.995C5.72833 9.13888 5.78549 9.27687 5.88723 9.37861C5.98897 9.48034 6.12695 9.5375 6.27083 9.5375C6.41471 9.5375 6.5527 9.48034 6.65444 9.37861C6.75618 9.27687 6.81333 9.13888 6.81333 8.995V6.81333H8.995C9.13888 6.81333 9.27687 6.75618 9.37861 6.65444C9.48034 6.5527 9.5375 6.41471 9.5375 6.27083C9.5375 6.12695 9.48034 5.98897 9.37861 5.88723C9.27687 5.78549 9.13888 5.72833 8.995 5.72833H6.81333V3.54667C6.81333 3.40279 6.75618 3.2648 6.65444 3.16306C6.5527 3.06132 6.41471 3.00417 6.27083 3.00417C6.12695 3.00417 5.98897 3.06132 5.88723 3.16306C5.78549 3.2648 5.72833 3.40279 5.72833 3.54667V5.72833H3.54667C3.40279 5.72833 3.2648 5.78549 3.16306 5.88723C3.06132 5.98897 3.00417 6.12695 3.00417 6.27083C3.00417 6.41471 3.06132 6.5527 3.16306 6.65444C3.2648 6.75618 3.40279 6.81333 3.54667 6.81333M8.5575 0H3.98417C2.9275 0 1.91411 0.419759 1.16694 1.16694C0.419759 1.91411 0 2.9275 0 3.98417V8.5575C0 9.61417 0.419759 10.6276 1.16694 11.3747C1.91411 12.1219 2.9275 12.5417 3.98417 12.5417H8.5575C9.61417 12.5417 10.6276 12.1219 11.3747 11.3747C12.1219 10.6276 12.5417 9.61417 12.5417 8.5575V3.98417C12.5417 2.9275 12.1219 1.91411 11.3747 1.16694C10.6276 0.419759 9.61417 0 8.5575 0V0Z" fill="#636674"/>
          </svg>
          <p className="font-medium text-[12px] text-[#9a9cae] leading-[12px]">New chat</p>
        </button>

        {/* Capture Lead Info button */}
        <button
          onClick={() => { onLead(); onClose(); }}
          className="w-full bg-[#006AE6] hover:bg-blue-500 flex items-center justify-center gap-[4px] px-[10px] py-[9px] rounded-[6px] transition-colors active:scale-[0.98]">
          <NoteIcon />
          <p className="font-medium text-[12px] text-[#f5f5f5] leading-[12px]">Capture Lead InFo</p>
        </button>

      </div>

      {/* ── Bottom bar ── */}
      <div className="pb-[7px] pl-[25px] pr-[15px] flex items-center justify-between shrink-0">
        <button
          onClick={() => { onTalkToHuman(); onClose(); }}
          title="Talk to human"
          className="w-[32px] h-[32px] rounded-full bg-[#f9f9f9] border border-[#99a1b7] flex items-center justify-center overflow-hidden text-gray-600 hover:opacity-80 transition-opacity">
          <UserIcon />
        </button>
        <button
          title="Notifications"
          className="w-[28px] h-[28px] flex items-center justify-center text-[#636674] hover:text-[#f5f5f5] transition-colors">
          <BellIcon />
        </button>
      </div>

    </div>
  );
}

// ── Message Input ─────────────────────────────────────────────────────────────
function MessageInput({ onSend, loading, disabled }: {
  onSend: (text: string) => void; loading: boolean; disabled: boolean;
}) {
  const [val, setVal] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  const send = () => {
    const t = val.trim();
    if (!t || loading || disabled) return;
    onSend(t);
    setVal("");
    ref.current?.focus();
  };

  return (
    <div className="bg-[#1f212a] border border-[#26272f] rounded-[6px] mx-0 flex items-center justify-between px-[10px] py-[8px] gap-[10px]">
      <div className="flex items-center gap-[10px] flex-1 min-w-0">
        <div className="w-[30px] h-[30px] rounded-full bg-[#f9f9f9] border border-[#99a1b7] flex items-center justify-center shrink-0 overflow-hidden text-gray-600">
          <UserIcon />
        </div>
        <textarea ref={ref} value={val} onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Write a message..." rows={1} disabled={disabled}
          className="flex-1 resize-none text-[11px] bg-transparent text-[#808290] placeholder-[#808290] focus:outline-none focus:text-[#f5f5f5] disabled:opacity-40 leading-[12px]"
          style={{ maxHeight: 80 }} />
      </div>
      <button onClick={send} disabled={!val.trim() || loading || disabled}
        className="bg-[#006AE6] hover:bg-blue-500 text-[#f5f5f5] font-medium text-[14px] leading-[12px] px-[16px] py-[10px] rounded-[6px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 shrink-0 flex items-center gap-1.5">
        <SendIcon />
        <span>Send</span>
      </button>
    </div>
  );
}

// ── MAIN WIDGET ───────────────────────────────────────────────────────────────
export default function App() {
  const [sessionId, setSessionId] = useState<string>(getOrCreateSessionId);
  const [settings,  setSettings]  = useState<Settings>({ faqs: true, leads: true });
  const [messages,  setMessages]  = useState<ChatMessage[]>([
    { id: 0, role: "bot", text: "Hi there! 👋 I'm Aria, your AI assistant. How can I help you today?", source: null },
  ]);
  const [loading,     setLoading]     = useState(false);
  const [chatClosed,  setChatClosed]  = useState(false);
  const [formType,    setFormType]    = useState<"lead" | "human" | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats,       setStats]       = useState<{ sessions: number; csat: number }>({ sessions: 0, csat: 94 });
  const endRef = useRef<HTMLDivElement>(null);
  const idRef  = useRef(1);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading, formType]);

  // Fetch live stats for sidebar profile card
  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => setStats({ sessions: d.sessions ?? 0, csat: d.csat ?? 94 }))
      .catch(() => {});
  }, []);

  // Close sidebar on resize to desktop
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const handler = (e: MediaQueryListEvent) => { if (e.matches) setSidebarOpen(false); };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const toggleSetting = (key: keyof Settings) =>
    setSettings((s) => ({ ...s, [key]: !s[key] }));

  const addMsg = (role: "user" | "bot", text: string, source: string | null = null) =>
    setMessages((prev) => [...prev, { id: idRef.current++, role, text, source }]);

  // ── New Chat ────────────────────────────────────────────────────────────────
  const handleNewChat = () => {
    const newId = makeSessionId();
    setSessionId(newId);
    idRef.current = 1;
    setMessages([{ id: 0, role: "bot", text: "Hi there! 👋 I'm Aria, your AI assistant. How can I help you today?", source: null }]);
    setLoading(false);
    setChatClosed(false);
    setFormType(null);
  };

  // ── Lead submit (Need Demo / Capture Lead Info) ───────────────────────────────
  const handleLeadSubmit = async ({ name, email }: { name: string; email: string }) => {
    setFormType(null);
    addMsg("user", "I'd like to request a demo");
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, name, email }),
      });
    } catch { /* non-blocking */ }
    addMsg("bot", `Thanks ${name}! Our team will email **${email}** within 24 hours to schedule your personalised demo. 🎉`, "system");
  };

  // ── Talk to Human submit ──────────────────────────────────────────────────────
  const handleHumanSubmit = async ({ name, email }: { name: string; email: string }) => {
    setFormType(null);
    addMsg("user", "I'd like to talk to a human agent");
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, name, email, type: "human_request" }),
      });
    } catch { /* non-blocking */ }
    addMsg("bot", `Thanks ${name}! A human agent will reach out to **${email}** within 24 hours. We'll be in touch soon! 👋`, "system");
    setChatClosed(true);
  };

  // ── Send message ─────────────────────────────────────────────────────────────
  const handleSend = async (text: string) => {
    if (loading || chatClosed) return;
    setFormType(null);
    addMsg("user", text);
    setLoading(true);

    try {
      // ── Demo intercept: show lead form instead of a text reply ──
      const isDemoRequest = settings.leads && ["demo", "walkthrough", "tour", "show me", "see it"].some((k) =>
        text.toLowerCase().includes(k)
      );
      if (isDemoRequest) {
        await new Promise((r) => setTimeout(r, 500));
        addMsg("bot", "Great! I'd love to set up a personalised demo for you. 🎯 Please fill in your details below and our team will reach out within 24 hours.", "faq");
        setLoading(false);
        setFormType("lead");
        return;
      }

      if (settings.faqs) {
        const faqAnswer = matchLocalFAQ(text);
        if (faqAnswer) {
          await new Promise((r) => setTimeout(r, 500));
          addMsg("bot", faqAnswer, "faq");
          setLoading(false);
          return;
        }
      }
      const res = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId, message: text,
          context: messages.slice(-10).map((m) => ({
            role: m.role === "bot" ? "assistant" : "user",
            content: m.text,
          })),
        }),
      });
      const data = await res.json();
      addMsg("bot", data.reply, data.source || "llm");
    } catch {
      addMsg("bot", "I'm having trouble connecting right now. Please try again in a moment.", "fallback");
    } finally {
      setLoading(false);
    }
  };

  const showQuickReplies = messages.length === 1 && !loading && !chatClosed && !formType;

  return (
    <div className="h-screen flex overflow-hidden bg-[#111217] text-white relative">

      {/* ── Mobile sidebar overlay backdrop ── */}
      {sidebarOpen && (
        <div
          className="sm:hidden fixed inset-0 bg-black/60 z-20"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar — always visible on sm+, drawer on mobile ── */}
      <div className={`
        fixed sm:relative inset-y-0 left-0 z-30
        transform transition-transform duration-300 ease-in-out
        sm:transform-none sm:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        sm:flex shrink-0
      `}>
        <Sidebar
          settings={settings}
          onChange={toggleSetting}
          onNewChat={handleNewChat}
          onClose={() => setSidebarOpen(false)}
          onLead={() => { setFormType("lead"); setSidebarOpen(false); }}
          onTalkToHuman={() => { setFormType("human"); setSidebarOpen(false); }}
          stats={stats}
        />
      </div>

      {/* ── Main Chat ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0d0e12]">

        {/* Header */}
        <div className="px-[20px] py-0 flex items-center shrink-0" style={{ minHeight: 70 }}>
          {/* Hamburger — mobile only */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="sm:hidden text-[#636674] hover:text-[#f5f5f5] transition-colors p-1 -ml-1 mr-3">
            <MenuIcon />
          </button>
          <div className="flex-1 flex flex-col gap-[12px]">
            <p className="font-medium text-[18px] text-[#f5f5f5] leading-[18px] tracking-[-0.18px]">Clarix</p>
            <p className="text-[13px] text-[#9a9cae] leading-[14px]">Online - Typically Replies Instantly</p>
          </div>
          <div className="flex items-center gap-[4px] px-[10px] py-[8px] rounded-[6px]">
            <span className="w-[6px] h-[6px] rounded-full bg-[#00af0c]" />
            <p className="font-medium text-[12px] text-[#00af0c] leading-[12px] hidden sm:block">Bot Active</p>
          </div>
        </div>

        {/* Messages card */}
        <div className="flex-1 min-h-0 mx-[20px] mb-[20px] bg-[#111217] border border-[#1b1c22] rounded-[12px] overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto py-[20px]">
            {messages.map((m) => <Bubble key={m.id} msg={m} />)}

            {/* Quick replies in chat */}
            <ChatQuickReplies
              settings={settings}
              visible={showQuickReplies}
              onFAQ={handleSend}
              onLead={() => setFormType("lead")}
            />

            {/* Inline lead/demo form */}
            {formType === "lead" && (
              <InlineFormCard
                title="Capture Lead InFo"
                submitLabel="Book Demo"
                onSubmit={handleLeadSubmit}
                onDismiss={() => setFormType(null)}
              />
            )}

            {/* Inline talk-to-human form */}
            {formType === "human" && (
              <InlineFormCard
                title="Talk to a Human"
                submitLabel="Connect Me"
                onSubmit={handleHumanSubmit}
                onDismiss={() => setFormType(null)}
              />
            )}

            {/* Typing indicator */}
            {loading && (
              <div className="flex items-end gap-[14px] px-[20px] mb-[10px]">
                <BotAvatar size={30} />
                <div className="rounded-br-[12px] rounded-tl-[12px] rounded-tr-[12px] border"
                  style={{ background: "#0d0e12", borderColor: "rgba(54,56,67,0.5)" }}>
                  <TypingDots />
                </div>
              </div>
            )}

            <div ref={endRef} />
          </div>
        </div>

        {/* Message Input — or Closed Banner */}
        <div className="px-[20px] pb-[20px] shrink-0">
          {chatClosed ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="flex items-center gap-2 text-xs text-[#636674]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>This chat session has ended. Start a new chat to continue.</span>
              </div>
              <button
                onClick={handleNewChat}
                className="px-5 py-2 bg-[#006AE6] hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors duration-150 active:scale-95 flex items-center gap-2">
                <PlusIcon />
                Start New Chat
              </button>
            </div>
          ) : (
            <MessageInput onSend={handleSend} loading={loading} disabled={false} />
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-[14px] text-[#636674] pb-[20px] flex items-center justify-center gap-[12px] shrink-0">
          <span>Powered By Clarix AI</span>
          <span className="w-[6px] h-[6px] rounded-full bg-[#636674] inline-block" />
          <span>End to End Encrypted</span>
        </div>
      </div>
    </div>
  );
}
