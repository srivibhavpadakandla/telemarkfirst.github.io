import React, {type ReactNode} from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import AskLauncher from '@site/src/components/ui/AskLauncher';

interface RootProps {
  children: ReactNode;
}

export default function Root({children}: RootProps): React.JSX.Element {
  const {siteConfig} = useDocusaurusContext();
  const previewSite = siteConfig.customFields?.previewSite === true;
  return (
    <>
      {previewSite ? <div className="telemark-preview-banner" role="status">
        <strong>Telemark testing site</strong>
        <span>Changes here are for review. Sign-in and cloud sync are disabled; lesson progress stays in this browser.</span>
        <a href="https://telemarkfirst.github.io/">Live Telemark</a>
      </div> : <AskLauncher />}
      {children}
    </>
  );
}
