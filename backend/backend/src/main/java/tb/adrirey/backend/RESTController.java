package tb.adrirey.backend;

import org.springframework.web.bind.annotation.*;

import javax.crypto.BadPaddingException;
import javax.crypto.Cipher;
import javax.crypto.IllegalBlockSizeException;
import javax.crypto.NoSuchPaddingException;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.Key;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

@RestController
public class RESTController {
    ServerCommandProxy scp;

    private byte[] key = {(byte) 0xbf, (byte) 0xc1, (byte) 0xc1, (byte) 0x8b, (byte) 0x3c, (byte) 0x60, (byte) 0x50, (byte) 0x2a,
            (byte) 0x4f, (byte) 0x08, (byte) 0xdf, (byte) 0xb6, (byte) 0xe0, (byte) 0xd9, (byte) 0xd1, (byte) 0x1f};
    private final Key aesMasterKey = new SecretKeySpec(key, "AES");

    public RESTController() {
        scp = new ServerCommandProxy("PaperCutServer", 9191, "authToken");
    }

    @RequestMapping("/getUserName")
    public String getName(@RequestParam String data) {
        return scp.lookUpUserNameByCardNo(data);
    }

    @RequestMapping("/getCredit")
    public double getCredit(@RequestParam String data) {
        return scp.getUserAccountBalance(scp.lookUpUserNameByCardNo(data));
    }

    @RequestMapping("/getEncryptID")
    public String aesEncryptedData(@RequestParam String data) throws NoSuchPaddingException, IllegalBlockSizeException, NoSuchAlgorithmException, BadPaddingException, InvalidKeyException {
        Cipher cipher = Cipher.getInstance("AES");
        cipher.init(Cipher.ENCRYPT_MODE, aesMasterKey);
        byte[] cipherText = cipher.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return Base64.getEncoder().encodeToString(cipherText);
    }
}