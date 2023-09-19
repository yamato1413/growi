import {
  forwardRef, useMemo, useRef, useEffect, useCallback,
} from 'react';

import { defaultKeymap } from '@codemirror/commands';
import { indentUnit } from '@codemirror/language';
import { keymap } from '@codemirror/view';
import type { ReactCodeMirrorProps } from '@uiw/react-codemirror';
import { useDropzone } from 'react-dropzone';

import { GlobalCodeMirrorEditorKey } from '../../consts';
import { useCodeMirrorEditorIsolated } from '../../stores';

import { Toolbar } from './Toolbar';

import style from './CodeMirrorEditor.module.scss';

const CodeMirrorEditorContainer = forwardRef<HTMLDivElement>((props, ref) => {
  return (
    <div {...props} className={`flex-expand-vert ${style['codemirror-editor-container']}`} ref={ref} />
  );
});


type Props = {
  editorKey: string | GlobalCodeMirrorEditorKey,
  onChange?: (value: string) => void,
  onUpload?: (file: any) => Promise<void>,
  indentSize?: number,
}

export const CodeMirrorEditor = (props: Props): JSX.Element => {
  const {
    editorKey,
    onChange,
    onUpload,
    indentSize,
  } = props;

  const containerRef = useRef(null);

  const cmProps = useMemo<ReactCodeMirrorProps>(() => {
    return {
      onChange,
    };
  }, [onChange]);
  const { data: codeMirrorEditor } = useCodeMirrorEditorIsolated(editorKey, containerRef.current, cmProps);

  useEffect(() => {
    const extension = keymap.of([
      ...defaultKeymap,
    ]);

    const cleanupFunction = codeMirrorEditor?.appendExtensions?.(extension);
    return cleanupFunction;

  }, [codeMirrorEditor]);

  useEffect(() => {
    if (indentSize == null) {
      return;
    }
    const extension = indentUnit.of(' '.repeat(indentSize));

    const cleanupFunction = codeMirrorEditor?.appendExtensions?.(extension);
    return cleanupFunction;

  }, [codeMirrorEditor, indentSize]);

  // ------------------------| Dropzone |------------------------------------------
  const dropHandler = useCallback((accepted) => {
    if (onUpload == null) {
      return;
    }
    accepted.forEach(file => onUpload(file));
  }, [onUpload]);

  const { getRootProps, open } = useDropzone(
    {
      noKeyboard: true,
      noClick: true,
      onDrop: dropHandler,
    },
  );

  // ------------------------| Dropzone |-------------------------------------------
  return (
    <div {...getRootProps()} className="flex-expand-vert">
      <CodeMirrorEditorContainer ref={containerRef} />
      <Toolbar fileOpen={open} />
    </div>
  );
};
