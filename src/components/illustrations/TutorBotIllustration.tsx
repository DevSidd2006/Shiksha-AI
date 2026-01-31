import React from 'react';
import Svg, { Rect, Circle, Path, SvgProps } from 'react-native-svg';

const TutorBotIllustration = (props: SvgProps) => (
  <Svg width={200} height={200} viewBox="0 0 200 200" fill="none" {...props}>
    <Rect width="200" height="200" rx="30" fill="#F5F3FF" />
    <Circle cx="100" cy="80" r="40" fill="#8B5CF6" />
    <Path
      d="M40 160C40 130 66.8629 110 100 110C133.137 110 160 130 160 160V180H40V160Z"
      fill="#7C3AED"
    />
    <Rect x="130" y="40" width="40" height="40" rx="10" fill="#EC4899" />
    <Path
      d="M140 50L160 70M160 50L140 70"
      stroke="white"
      strokeWidth="3"
      strokeLinecap="round"
    />
  </Svg>
);

export default TutorBotIllustration;
