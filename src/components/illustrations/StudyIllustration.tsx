import React from 'react';
import Svg, { Circle, Rect, Path, SvgProps } from 'react-native-svg';

const StudyIllustration = (props: SvgProps) => (
  <Svg width={200} height={200} viewBox="0 0 200 200" fill="none" {...props}>
    <Circle cx="100" cy="100" r="80" fill="#EEF2FF"/>
    <Rect x="60" y="80" width="80" height="60" rx="4" fill="#6366F1"/>
    <Path d="M60 84L100 60L140 84V140H60V84Z" fill="#4F46E5"/>
    <Path d="M80 100H120M80 115H110M80 130H100" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    <Circle cx="150" cy="60" r="15" fill="#8B5CF6"/>
    <Path d="M145 60L150 65L155 55" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export default StudyIllustration;
