import React from 'react';
import {Redirect} from '@docusaurus/router';
import useBaseUrl from '@docusaurus/useBaseUrl';

/** Keep existing Blocks bookmarks working after removing the overview. */
export default function BlocksRedirect(): React.JSX.Element {
  return <Redirect to={useBaseUrl('/blocks/blocks-unit-00/workspace-and-run-controls')} />;
}
