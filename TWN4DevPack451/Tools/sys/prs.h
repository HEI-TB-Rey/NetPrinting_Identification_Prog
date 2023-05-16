#ifndef __PRS_H__
#define __PRS_H__

// ******************************************************************
// ****** Definitions ***********************************************
// ******************************************************************

// ------ Error codes generated by the protocol level ---------------

#define ERR_NONE                    0
#define ERR_UNKNOWN_FUNCTION        1
#define ERR_MISSING_PARAMETER       2
#define ERR_UNUSED_PARAMETERS       3
#define ERR_INVALID_FUNCTION        4
#define ERR_PARSER                  5
#define ERR_LENGTH                  6

// ------ Communication modes ---------------------------------------

#define PRS_COMM_MODE_MSK			0x03
#define PRS_COMM_MODE_BINARY		0x00
#define PRS_COMM_MODE_ASCII			0x01

#define PRS_COMM_CRC_MSK			0x0C
#define PRS_COMM_CRC_OFF			0x00
#define PRS_COMM_CRC_ON				0x04

// ******************************************************************
// ****** Variables *************************************************
// ******************************************************************

extern byte SimpleProtoMessage[17000];
extern int SimpleProtoMessageLength;

// ******************************************************************
// ****** Prototypes ************************************************
// ******************************************************************

bool SimpleProtoInit(int Channel,int Mode);
bool SimpleProtoTestCommand(void);
void SimpleProtoExecuteCommand(void);
void SimpleProtoSendResponse(void);
void SetSimpleProtoMessage(byte* Source, int Length);
void GetSimpleProtoMessage(byte* SimpleMessage, int* Length);

#endif
