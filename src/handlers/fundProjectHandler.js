const metrics = require('datadog-metrics');

function schema() {
  return {
    params: {
      type: "object",
      properties: {
        projectId: {
          type: "integer",
        },
        funderPrivateKey: {
          type: "string",
        },
        amount: {
          type: "number",
          exclusiveMinimum: 0
        },
      },
    },
    required: ["projectId", "funderPrivateKey", "amount"],
  };
}

function handler({ contractInteraction, walletService }) {
  return async function (req, reply) {
    console.log(`project_id: ${req.params.projectId} privateKey: ${req.body.funderPrivateKey} amount: ${req.body.amount}`)

    let funderWallet = walletService.getWallet(req.body.funderPrivateKey)
    const contractResponse = await contractInteraction.fundProject(funderWallet, req.body.amount, req.params.projectId);

    if (contractResponse.status != "ok") {
      reply.code(500).send(contractResponse);
    }

    metrics.increment('funds_received', 1, [`project_id:${contractResponse.result.projectWalletId}`, `funder_address:${contractResponse.result.funderAddress}`, `project_status:${contractResponse.result.projectStatus}`]);
    metrics.gauge('funds_received_amount', contractResponse.result.fundsReceived, [`project_id:${contractResponse.result.projectWalletId}`, `funder_address:${contractResponse.result.funderAddress}`, `project_status:${contractResponse.result.projectStatus}`]);
    
    reply.code(200).send(contractResponse.result);
  };
}

module.exports = { schema, handler };
