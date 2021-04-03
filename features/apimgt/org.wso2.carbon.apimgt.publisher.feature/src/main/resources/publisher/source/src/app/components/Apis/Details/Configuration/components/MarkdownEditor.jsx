/*
 * Copyright (c) 2020, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React, { useState, Suspense, lazy } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import Slide from '@material-ui/core/Slide';
import Icon from '@material-ui/core/Icon';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import CircularProgress from '@material-ui/core/CircularProgress';
import { isRestricted } from 'AppData/AuthManager';
import CONSTS from 'AppData/Constants';
import { useAPI } from 'AppComponents/Apis/Details/components/ApiContext';

const MonacoEditor = lazy(() => import('react-monaco-editor' /* webpackChunkName: "MDMonacoEditor" */));
const ReactMarkdown = lazy(() => import('react-markdown' /* webpackChunkName: "MDReactMarkdown" */));

const useStyles = makeStyles(() => ({
    flex: {
        flex: 1,
    },
    popupHeader: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
    },
    splitWrapper: {
        padding: 0,
    },
    editorHeader: {
        alignItems: 'center',
        display: 'flex',
    },
    markdownViewWrapper: {
        height: '100vh',
        overflowY: 'auto',
    },
    button: {
        height: 30,
        marginLeft: 30,
    },
}));

function Transition(props) {
    return <Slide direction='up' {...props} />;
}

/**
 * MarkdownEditor for API Description / Overview
 * @param {*} props properties
 * @returns {*} MarkdownEditor component
 */
export default function MarkdownEditor(props) {
    const classes = useStyles();
    const {
        api,
        updateContent,
        descriptionType,
        overview,
    } = props;
    const [open, setOpen] = useState(false);
    const [content, setContent] = useState(null);
    const [apiFromContext] = useAPI();
    const [isUpdating, setIsUpdating] = useState(false);

    const toggleOpen = () => {
        if (!open) {
            if (descriptionType === CONSTS.DESCRIPTION_TYPES.DESCRIPTION) {
                setContent(api.description);
            } else if (descriptionType === CONSTS.DESCRIPTION_TYPES.OVERVIEW) {
                setContent(overview);
            }
        }
        setOpen(!open);
    };
    const setNewContent = (newContent) => {
        setContent(newContent);
    };
    const modifyContent = () => {
        setIsUpdating(true);
        updateContent(content);
        toggleOpen();
        setIsUpdating(false);
    };
    const editorDidMount = (editor) => {
        editor.focus();
    };

    return (
        <div>
            <Button
                variant='outlined'
                color='primary'
                disabled={isRestricted(['apim:api_create'], apiFromContext)}
                onClick={toggleOpen}
            >
                {api.description || overview ? (
                    <FormattedMessage
                        id='Apis.Details.Configuration.components.MarkdownEditor.edit.content.button'
                        defaultMessage='Edit Content'
                    />
                ) : (
                    <FormattedMessage
                        id='Apis.Details.Configuration.components.MarkdownEditor.add.content.button'
                        defaultMessage='Add Content'
                    />
                )}
            </Button>
            <Dialog fullScreen open={open} onClose={toggleOpen} TransitionComponent={Transition}>
                <Paper square className={classes.popupHeader}>
                    <IconButton color='inherit' onClick={toggleOpen} aria-label='Close'>
                        <Icon>close</Icon>
                    </IconButton>
                    <Typography variant='h4' className={classes.editorHeader}>
                        {descriptionType === CONSTS.DESCRIPTION_TYPES.DESCRIPTION
                            ? (
                                <FormattedMessage
                                    id='Apis.Details.Configuration.components.MarkdownEditor.edit.description.of'
                                    defaultMessage='Edit Description of '
                                />
                            )
                            : (
                                <FormattedMessage
                                    id='Apis.Details.Configuration.components.MarkdownEditor.edit.overview.of'
                                    defaultMessage='Edit Overview of '
                                />
                            )}
                        {api.name}
                    </Typography>
                    <Button
                        className={classes.button}
                        variant='contained'
                        disabled={isUpdating}
                        color='primary'
                        onClick={modifyContent}
                    >
                        <FormattedMessage
                            id='Apis.Details.Configuration.components.MarkdownEditor.update.content.button'
                            defaultMessage='Update Content'
                        />
                        {isUpdating && <CircularProgress size={24} />}
                    </Button>
                    <Button className={classes.button} onClick={toggleOpen}>
                        <FormattedMessage
                            id='Apis.Details.Configuration.components.MarkdownEditor.cancel.button'
                            defaultMessage='Cancel'
                        />
                    </Button>
                </Paper>
                <div className={classes.splitWrapper}>
                    <Grid container spacing={7}>
                        <Grid item xs={6}>
                            <Suspense fallback={<CircularProgress />}>
                                <MonacoEditor
                                    width='100%'
                                    height='100vh'
                                    language='markdown'
                                    theme='vs-dark'
                                    value={content}
                                    options={{ selectOnLineNumbers: true }}
                                    onChange={setNewContent}
                                    editorDidMount={editorDidMount}
                                />
                            </Suspense>
                        </Grid>
                        <Grid item xs={6}>
                            <div className={classes.markdownViewWrapper}>
                                <Suspense fallback={<CircularProgress />}>
                                    <ReactMarkdown escapeHtml={false} source={content} />
                                </Suspense>
                            </div>
                        </Grid>
                    </Grid>
                </div>
            </Dialog>
        </div>
    );
}

MarkdownEditor.propTypes = {
    api: PropTypes.shape({}).isRequired,
    updateContent: PropTypes.func.isRequired,
    descriptionType: PropTypes.string.isRequired,
    overview: PropTypes.string.isRequired,
};
