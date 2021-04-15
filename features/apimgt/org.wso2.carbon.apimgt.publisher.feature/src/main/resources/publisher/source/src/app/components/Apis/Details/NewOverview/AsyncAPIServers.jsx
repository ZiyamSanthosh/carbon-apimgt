/*
 * Copyright (c) 2019, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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

import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import API from 'AppData/api';
import { parse } from '@asyncapi/parser';
import { withAPI } from 'AppComponents/Apis/Details/components/ApiContext';
import Typography from '@material-ui/core/Typography';
import { FormattedMessage } from 'react-intl';
import Grid from '@material-ui/core/Grid';
import Chip from '@material-ui/core/Chip';

function AsyncAPIServers(props) {
    const { parentClasses, api } = props;
    const restAPI = new API();
    const [servers, setServers] = useState(null);
    const [serverNames, setServerNames] = useState(null);
    const refresh = false;

    useEffect(() => {
        const promise = restAPI.getAsyncAPIDefinition(api.id);
        const serversArray = [];
        const serverNamesArray = [];
        promise.then(async (response) => {
            const doc = await parse(response.data);
            if (doc.hasServers()) {
                doc.serverNames().map((serverName) => {
                    const protocol = doc.server(serverName).protocol();
                    const url = doc.server(serverName).url();
                    serversArray[serverName] = { protocol, url };
                    serverNamesArray.push(serverName);
                    return '';
                });
            }
            setServers(serversArray);
            setServerNames(serverNamesArray);
        });
    }, [refresh]);

    return (
        <>
            {servers && (
                <Grid container spacing={2} xs={12}>
                    <Grid item spacing={2} xs={12}>
                        <Typography variant='h5' component='h3' className={parentClasses.title}>
                            <FormattedMessage
                                id='Apis.Details.NewOverview.AsyncAPI.servers'
                                defaultMessage='Protocols & Endpoints'
                            />
                        </Typography>
                    </Grid>
                    <Grid item spacing={2} xs={12}>
                        {serverNames && (
                            <Grid container spacing={2} xs={12}>
                                {serverNames.map((server) => {
                                    return (
                                        <>
                                            <Grid item spacing={2} xs={12}>
                                                <Typography
                                                    component='p'
                                                    variant='subtitle2'
                                                    className={parentClasses.subtitle}
                                                >
                                                    {server}
                                                </Typography>
                                            </Grid>
                                            <Grid item spacing={2} xs={12}>
                                                <Grid container spacing={2}>
                                                    <Grid item>
                                                        <Typography component='p' variant='body1'>
                                                            <FormattedMessage
                                                                id='Apis.Details.NewOverview.Endpoints.blank'
                                                                defaultMessage='-'
                                                            />
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item>
                                                        <Chip
                                                            label={servers[server].protocol}
                                                            size='small'
                                                            color='primary'
                                                        />
                                                    </Grid>
                                                    <Grid
                                                        item
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                        }}
                                                    >
                                                        <Typography component='p' variant='body1'>
                                                            {servers[server].url}
                                                        </Typography>
                                                    </Grid>
                                                </Grid>
                                            </Grid>
                                        </>
                                    );
                                })}
                            </Grid>
                        )}
                    </Grid>
                </Grid>
            )}
        </>
    );
}

AsyncAPIServers.propTypes = {
    parentClasses: PropTypes.shape({}).isRequired,
    api: PropTypes.shape({}).isRequired,
};

export default withAPI(AsyncAPIServers);
