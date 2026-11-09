import React from 'react';
import {Redirect} from '@docusaurus/router';
import useBaseUrl from '@docusaurus/useBaseUrl';

/** Keep existing FLL bookmarks working after removing the overview. */
export default function FllRedirect(): React.JSX.Element {
  return <Redirect to={useBaseUrl('/fll/unit-00/design-as-simple-machines')} />;
}
