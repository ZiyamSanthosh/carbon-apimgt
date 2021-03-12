package org.wso2.carbon.apimgt.gateway.handlers.graphQL;

import graphql.analysis.FieldComplexityCalculator;
import graphql.analysis.FieldComplexityEnvironment;
import graphql.language.Argument;
import graphql.language.IntValue;
import org.apache.axiom.om.OMAbstractFactory;
import org.apache.axiom.om.OMElement;
import org.apache.axiom.om.OMFactory;
import org.apache.axiom.om.OMNamespace;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.apache.http.HttpStatus;
import org.apache.synapse.Mediator;
import org.apache.synapse.MessageContext;
import org.apache.synapse.SynapseConstants;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.wso2.carbon.apimgt.gateway.handlers.Utils;
import org.wso2.carbon.apimgt.gateway.handlers.security.APISecurityConstants;
import org.wso2.carbon.apimgt.impl.APIConstants;

import java.math.BigInteger;
import java.util.List;

/**
 * This Class can be used to calculate fields complexity values of GraphQL Query.
 */
public class FieldComplexityCalculatorImpl implements FieldComplexityCalculator {
    private static final Log log = LogFactory.getLog(FieldComplexityCalculatorImpl.class);
    JSONParser jsonParser = new JSONParser();
    JSONObject policyDefinition;

    public FieldComplexityCalculatorImpl(MessageContext messageContext) {
        try {
            String graphQLAccessControlPolicy = (String) messageContext
                    .getProperty(APIConstants.GRAPHQL_ACCESS_CONTROL_POLICY);
            if (graphQLAccessControlPolicy == null) {
                policyDefinition = new JSONObject();
            } else {
                JSONObject jsonObject = (JSONObject) jsonParser.parse(graphQLAccessControlPolicy);
                 policyDefinition = (JSONObject) jsonObject.get(APIConstants.QUERY_ANALYSIS_COMPLEXITY);
            }

        } catch (ParseException e) {
            String errorMessage = "Policy definition parsing failed. ";
            handleFailure(messageContext, errorMessage, errorMessage);
        }
    }

    @Override
    public int calculate(FieldComplexityEnvironment fieldComplexityEnvironment, int childComplexity) {
        String fieldName = fieldComplexityEnvironment.getField().getName();
        String parentType = fieldComplexityEnvironment.getParentType().getName();
        List<Argument> ArgumentList = fieldComplexityEnvironment.getField().getArguments();

        int argumentsValue = getArgumentsValue(ArgumentList);
        int customFieldComplexity = getCustomComplexity(fieldName, parentType, policyDefinition);
        return (argumentsValue * (customFieldComplexity + childComplexity));
    }

    private int getCustomComplexity(String fieldName, String parentType, JSONObject policyDefinition) {
        JSONObject customComplexity = (JSONObject) policyDefinition.get(parentType);
        if (customComplexity != null && customComplexity.get(fieldName) != null) {
            //TODO:chnge as interger
            return ((Long) customComplexity.get(fieldName)).intValue(); // Returns custom complexity value
        } else {
            if (log.isDebugEnabled()) {
                log.debug("No custom complexity value was assigned for " + fieldName + " under type " + parentType);
            }
            return 1; // Returns default complexity value
        }
    }

    private int getArgumentsValue(List<Argument> argumentList) {
        int argumentValue = 0;
        if (argumentList.size() > 0) {
            for (Argument object : argumentList) {
                BigInteger value = ((IntValue) object.getValue()).getValue();
                int val = value.intValue();
                argumentValue = argumentValue + val;
            }
        } else {
            argumentValue = 1;
        }
        return argumentValue;
    }

    /**
     * This method handle the failure
     *  @param messageContext   message context of the request
     * @param errorMessage     error message of the failure
     * @param errorDescription error description of the failure
     */
    private void handleFailure(MessageContext messageContext, String errorMessage, String errorDescription) {
        messageContext.setProperty(SynapseConstants.ERROR_CODE, GraphQLConstants.GRAPHQL_INVALID_QUERY);
        messageContext.setProperty(SynapseConstants.ERROR_MESSAGE, errorMessage);
        messageContext.setProperty(SynapseConstants.ERROR_EXCEPTION, errorDescription);
        Mediator sequence = messageContext.getSequence(GraphQLConstants.GRAPHQL_API_FAILURE_HANDLER);
        if (sequence != null && !sequence.mediate(messageContext)) {
            return;
        }
        Utils.sendFault(messageContext, HttpStatus.SC_BAD_REQUEST);
    }


}